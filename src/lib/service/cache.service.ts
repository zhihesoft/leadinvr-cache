import KeyvRedis from "@keyv/redis";
import { Inject, Injectable, OnModuleDestroy } from "@nestjs/common";
import { Cacheable, Keyv } from "cacheable";
import { MODULE_OPTIONS_TOKEN } from "../cache.module-defination";
import { CacheModuleOptions } from "../cache.module.options";
import { MemoryStorage } from "./memory.storage";
import { RedisStorage } from "./redis.storage";

@Injectable()
export class CacheService implements OnModuleDestroy {
    constructor(
        @Inject(MODULE_OPTIONS_TOKEN)
        private readonly options: CacheModuleOptions,
    ) {
        const keyvRedis =
            options.redisUrl && options.redisUrl.length > 0
                ? (new RedisStorage(options.redisUrl, {
                      namespace: options.workspace,
                      keyPrefixSeparator: ":",
                  }) as unknown as KeyvRedis<any>)
                : undefined;

        this.cache = new Cacheable({
            primary: new Keyv(new MemoryStorage()),
            secondary: keyvRedis
                ? new Keyv(keyvRedis, {
                      namespace: options.workspace,
                      useKeyPrefix: false,
                  })
                : undefined,
        });
    }

    private readonly cache: Cacheable;

    public get workspace() {
        return this.options.workspace || "default";
    }

    async onModuleDestroy() {
        await this.cache.disconnect();
    }

    /**
     * try to get key value
     * @param key key
     * @returns
     */
    get<T>(key: string): Promise<T | undefined> {
        return this.cache.get<T>(key);
    }

    /**
     * set key value
     * @param key key
     * @param value value
     * @param ttl ttl in seconds
     * @returns
     */
    async set<T>(key: string, value: T, ttl: number): Promise<void> {
        await this.cache.set(key, value, ttl * 1000);
        return;
    }

    /**
     * Remove a key
     * @param key
     */
    remove(key: string | string[]): Promise<boolean> {
        if (Array.isArray(key)) {
            return this.cache.deleteMany(key);
        }
        return this.cache.delete(key);
    }

    /**
     * Remove keys by pattern
     */
    clear(): Promise<void> {
        return this.cache.clear();
    }

    /**
     * Key value exists
     * @param key
     * @returns
     */
    has(key: string): Promise<boolean> {
        return this.cache.has(key);
    }
}
