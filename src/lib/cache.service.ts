import { Inject, Injectable, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";
import ms from "ms";

import { MODULE_OPTIONS_TOKEN } from "../cache.module-defination";
import { CacheModuleOptions } from "../cache.module.options";

class CachedData<T = unknown> {
    constructor(public readonly value: T) {}
}

@Injectable()
export class CacheService implements OnModuleDestroy {
    constructor(@Inject(MODULE_OPTIONS_TOKEN) options: CacheModuleOptions) {
        this.cache = new Redis(options.redisUrl!, {
            keyPrefix: `${options.workspace}:`,
        });
    }

    private readonly cache: Redis;

    async onModuleDestroy() {
        await this.cache.disconnect();
    }

    /**
     * try to get key value
     * @param key key
     * @returns
     */
    async get<T>(key: string): Promise<T | undefined> {
        const data = await this.cache.get(key);
        if (data === null) {
            return undefined;
        }

        const obj = JSON.parse(data) as CachedData<T>;
        return obj.value;
    }

    /**
     * set key value
     * @param key key
     * @param value value
     * @param ttl ttl in seconds or ms format string
     * @returns
     */
    async set<T>(
        key: string,
        value: T,
        ttl: number | string = "10m",
    ): Promise<void> {
        const seconds =
            typeof ttl === "string" ? ms(ttl as ms.StringValue) / 1000 : ttl;
        const data: CachedData<T> = {
            value,
        };
        await this.cache.set(key, JSON.stringify(data), "EX", seconds);
        return;
    }

    /**
     * Remove a key or keys
     * @param key
     */
    remove(key: string | string[]) {
        const arr = Array.isArray(key) ? key : [key];
        return this.cache.del(...arr);
    }

    /**
     * Remove keys by pattern
     * @param pattern
     * Supported glob-style patterns:
     *   h?llo matches hello, hallo and hxllo
     *   h*llo matches hllo and heeeello
     *   h[ae]llo matches hello and hallo, but not hillo
     *   h[^e]llo matches hallo, hbllo, ... but not hello
     *   h[a-b]llo matches hallo and hbllo
     */
    removeByPattern(pattern: string): Promise<void> {
        return this.cache.keys(pattern).then(keys => {
            if (keys.length) {
                this.cache.del(...keys);
            }
        });
    }

    /**
     * Remove all keys
     */
    clear() {
        this.cache.flushall();
    }

    /**
     * Key value exists
     * @param key
     * @returns
     */
    has(key: string): Promise<boolean> {
        return this.cache.get(key).then(value => !!value);
    }
}
