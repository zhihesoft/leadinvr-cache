import { Logger } from "@nestjs/common";
import { createClient, RedisClientType } from "redis";
import { CacheCore, CacheCoreOption } from "./cache.core";

class RedisCacheItem<T> {
    constructor(public readonly data?: T) {}
}

export class RedisCacheOption extends CacheCoreOption {
    constructor(
        /**
         * Cache workspace. Default is "default".
         */
        public readonly workspace: string = "default",
        /**
         * Default ttl in seconds, default is 10
         */
        public readonly ttl: number = 10,
        /**
         * Redis server URL, e.g., "redis[s]://[[username][:password]@][host][:port][/db-number]"
         */
        public readonly url: string,
    ) {
        super(workspace, ttl);
    }
}

export class RedisCache extends CacheCore {
    constructor(options: RedisCacheOption) {
        super(options);
        this.redisUrl = options.url;
    }

    private readonly redisUrl: string;
    private redis: RedisClientType | undefined;

    async init(): Promise<void> {
        const redis = await createClient({
            url: this.redisUrl,
        })
            .on("error", err => {
                logger.error("Redis error: " + (err.message ?? err));
            })
            .connect();

        this.redis = redis as unknown as RedisClientType;
    }

    async close(): Promise<void> {
        if (this.redis) {
            await this.redis.quit();
            this.redis = undefined;
        }
    }

    async keys(pattern?: string): Promise<string[]> {
        this.checkRedis();
        pattern = pattern ? this.getKey(pattern) : this.getKey("*");
        const keys = await this.redis!.keys(pattern);
        // remove workspace prefix from keys
        const workspacePrefix = `${this.options.workspace}:`;
        return keys.map(key => key.replace(workspacePrefix, ""));
    }
    has(key: string): Promise<boolean> {
        this.checkRedis();
        key = this.getKey(key);
        return this.redis!.exists(key).then(exists => exists > 0);
    }
    async get<T>(key: string): Promise<T | undefined> {
        this.checkRedis();
        key = this.getKey(key);
        return this.redis!.get(key).then(value => {
            if (!value) {
                return undefined;
            }
            try {
                const parsedValue = JSON.parse(value) as RedisCacheItem<T>;
                return parsedValue.data as T;
            } catch (error) {
                logger.error(`Failed to parse value for key ${key}: ${error}`);
                return undefined;
            }
        });
    }
    async set(key: string, value: any, ttl?: number): Promise<void> {
        this.checkRedis();
        ttl = ttl || this.options.ttl;
        key = this.getKey(key);
        const item = new RedisCacheItem(value);
        await this.redis!.set(key, JSON.stringify(item), {
            EX: ttl,
        });
    }
    async del(key: string | string[]): Promise<void> {
        this.checkRedis();
        const keys = Array.isArray(key)
            ? key.map(k => this.getKey(k))
            : [this.getKey(key)];
        await this.redis!.unlink(keys);
    }
    async clear(): Promise<void> {
        this.checkRedis();
        const workspace = this.options.workspace || "default";
        const keys = await this.redis!.keys(`${workspace}:*`);
        await this.del(keys);
    }

    private checkRedis() {
        if (!this.redis) {
            throw new Error(
                "Redis client is not initialized. Call init() first.",
            );
        }
        if (!this.redis.isReady) {
            throw new Error(
                "Redis client is not ready. Ensure the connection is established.",
            );
        }
        if (!this.redis.isOpen) {
            throw new Error(
                "Redis client is not open. Ensure the connection is established.",
            );
        }
    }
}

const logger = new Logger(RedisCache.name);
