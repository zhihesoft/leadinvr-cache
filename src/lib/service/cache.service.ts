import KeyvRedis from "@keyv/redis";
import { Inject, Injectable, OnModuleDestroy } from "@nestjs/common";
import { Cacheable } from "cacheable";
import { CACHE_MODULE_OPTIONS } from "../cache.module.constants";
import { CacheModuleOptions } from "../data/cache.module.options";

@Injectable()
export class CacheService implements OnModuleDestroy {
    constructor(
        @Inject(CACHE_MODULE_OPTIONS)
        private readonly options: CacheModuleOptions,
    ) {
        const redis = new KeyvRedis(options.redisUri);
        this.cache = new Cacheable({
            namespace: options.workspace,
            secondary: redis as any, // KeyvRedis is compatible with Cacheable
        });
    }

    private readonly cache: Cacheable;

    onModuleDestroy() {
        this.close();
    }

    /**
     * try to get key value
     * @param key key
     * @returns
     */
    async get<T>(
        key: string,
        creator?: { ttl: number | string | undefined; func: () => Promise<T> },
    ): Promise<T | undefined> {
        let ret = await this.getValue<T>(key);
        if (ret == undefined && creator) {
            ret = await creator.func();
            await this.set(key, ret, creator.ttl);
        }
        return ret;
    }

    /**
     * set key value
     * @param key key
     * @param value value
     * @param ttl ttl in seconds
     * @returns
     */
    async set<T>(key: string, value: T, ttl?: number | string): Promise<T> {
        await this.setValue(key, value, ttl);
        return value;
    }

    /**
     * Remove a key
     * @param key
     */
    async remove(key: string): Promise<void> {
        await this.cache.delete(key); // Ensure the cache is initialized
    }

    /**
     * Remove keys by pattern
     */
    async clear(): Promise<void> {
        await this.cache.clear();
    }

    /**
     * Key value exists
     * @param key
     * @returns
     */
    async has(key: string): Promise<boolean> {
        return this.cache.has(key); // Ensure the cache is initialized
    }

    async close() {
        this.cache.disconnect();
    }

    private async setValue(
        key: string,
        value: any,
        seconds?: number | string,
    ): Promise<void> {
        const data = { value };
        let ttl = seconds;
        if (seconds && typeof seconds === "number") {
            ttl = seconds * 1000;
        }
        await this.cache.set(key, data, ttl);
    }

    private async getValue<T>(key: string): Promise<T | undefined> {
        const data = await this.cache.get<{ value: T }>(key);
        return data?.value;
    }
}
