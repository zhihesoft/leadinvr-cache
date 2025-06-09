import {
    Inject,
    Injectable,
    Logger,
    OnModuleDestroy,
    OnModuleInit,
} from "@nestjs/common";
import { BasicClientSideCache, createClient, RedisClientType } from "redis";
import { CACHE_MODULE_OPTIONS } from "../cache.module.constants";
import { CacheModuleOptions } from "../data/cache.module.options";

@Injectable()
export class CacheService implements OnModuleDestroy, OnModuleInit {
    constructor(
        @Inject(CACHE_MODULE_OPTIONS)
        private readonly options: CacheModuleOptions,
    ) {}

    private clientCache: BasicClientSideCache | undefined;
    private redis: RedisClientType | undefined;

    public get workspace(): string {
        return this.options.workspace || "default";
    }

    public get cacheStats() {
        return this.clientCache?.stats();
    }

    async onModuleInit() {
        this.clientCache = new BasicClientSideCache({
            ttl: 0,
            maxEntries: 0,
            evictPolicy: "LRU",
        });
        const redis = await createClient({
            RESP: 3,
            url: this.options.redisUrl,
            clientSideCache: this.clientCache,
        })
            .on("error", err => {
                logger.error("Redis error: " + (err.message ?? err));
            })
            .connect();

        this.redis = redis as unknown as RedisClientType;
    }

    onModuleDestroy() {
        this.redis?.close();
    }

    /**
     * try to get key value
     * @param key key
     * @returns
     */
    async get<T>(
        key: string,
        creator?: { ttl: number; func: () => Promise<T> },
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
    async set<T>(key: string, value: T, ttl: number): Promise<T> {
        await this.setValue(key, value, ttl);
        return value;
    }

    /**
     * Remove a key
     * @param key
     */
    async remove(key: string): Promise<void> {
        key = this.getKey(key);
        await this.redis?.unlink(key); // Ensure the cache is initialized
    }

    /**
     * Remove keys by pattern
     */
    async clear(): Promise<void> {
        const keys = await this.redis?.keys(`${this.workspace}*`);
        await this.redis?.unlink(keys || []);
    }

    /**
     * Key value exists
     * @param key
     * @returns
     */
    async has(key: string): Promise<boolean> {
        const ret = await this.redis?.exists(key); // Ensure the redis client is initialized
        return !!ret;
    }

    private getKey(key: string): string {
        const workspace = this.options.workspace || "default";
        return `${workspace}:${key}`;
    }

    private async setValue(
        key: string,
        value: any,
        seconds?: number,
    ): Promise<void> {
        key = this.getKey(key);
        const data = JSON.stringify({ value });
        let ttl = { EX: seconds };
        await this.redis?.set(key, data, ttl);
    }

    private async getValue<T>(key: string): Promise<T | undefined> {
        key = this.getKey(key);
        const data = await this.redis?.get(key);
        if (!data) {
            return undefined;
        }
        return JSON.parse(data).value as T;
    }
}

const logger = new Logger(CacheService.name);
