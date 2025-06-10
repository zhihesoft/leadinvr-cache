import {
    Inject,
    Injectable,
    OnModuleDestroy,
    OnModuleInit,
} from "@nestjs/common";
import { CACHE_MODULE_OPTIONS } from "../cache.module.constants";
import { CacheModuleOptions } from "../data/cache.module.options";
import { CacheCore } from "./cache.core";
import { MemoryCache } from "./memory.cache";
import { RedisCache } from "./redis.cache";

@Injectable()
export class CacheService implements OnModuleDestroy, OnModuleInit {
    constructor(
        @Inject(CACHE_MODULE_OPTIONS)
        private readonly options: CacheModuleOptions,
    ) {
        if (options.redisUrl) {
            this.cache = new RedisCache({
                url: options.redisUrl,
                workspace: options.workspace,
                ttl: options.ttl,
            });
        } else {
            this.cache = new MemoryCache({
                workspace: options.workspace,
                ttl: options.ttl,
                maxSize: 1024,
            });
        }
    }

    private readonly cache: CacheCore;

    public get workspace() {
        return this.options.workspace || "default";
    }

    async onModuleInit() {
        await this.cache.init();
    }

    async onModuleDestroy() {
        await this.cache?.close();
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
    set<T>(key: string, value: T, ttl: number): Promise<void> {
        return this.cache.set(key, value, ttl);
    }

    /**
     * Remove a key
     * @param key
     */
    remove(key: string | string[]): Promise<void> {
        return this.cache.del(key);
    }

    keys(pattern?: string): Promise<string[]> {
        return this.cache.keys(pattern);
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
