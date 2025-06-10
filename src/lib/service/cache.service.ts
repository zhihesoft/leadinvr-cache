import {
    Inject,
    Injectable,
    Logger,
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
        this.layer1 = new MemoryCache({
            workspace: this.options.workspace,
            ttl: this.options.ttl,
            maxSize: 1024,
        });
    }

    private layer1: CacheCore;
    private layer2?: CacheCore;

    public get workspace() {
        return this.options.workspace || "default";
    }

    async onModuleInit() {
        await this.layer1.init();

        if (!this.options.redisUrl || this.options.redisUrl.trim() === "") {
            logger.warn(
                "Redis URL is not provided. Cache will only use in-memory storage.",
            );
            return;
        }

        this.layer2 = new RedisCache({
            url: this.options.redisUrl,
            workspace: this.options.workspace,
            ttl: this.options.ttl,
        });

        await this.layer2?.init();
    }

    async onModuleDestroy() {
        await this.layer1.close();
        await this.layer2?.close();
    }

    /**
     * try to get key value
     * @param key key
     * @returns
     */
    async get<T>(key: string): Promise<T | undefined> {
        let value = await this.layer1.get<T>(key);
        if (value) {
            return value;
        }

        if (this.layer2) {
            value = await this.layer2.get<T>(key);
            if (value) {
                // If found in layer2, set it in layer1 for faster access next time
                await this.layer1.set(key, value, this.options.ttl);
                return value;
            }
        }

        return undefined;
    }

    /**
     * set key value
     * @param key key
     * @param value value
     * @param ttl ttl in seconds
     * @returns
     */
    async set<T>(key: string, value: T, ttl: number): Promise<T> {
        await this.layer1.set(key, value, ttl);
        if (this.layer2) {
            await this.layer2.set(key, value, ttl);
        }
        return value;
    }

    /**
     * Remove a key
     * @param key
     */
    async remove(key: string | string[]): Promise<void> {
        await this.layer1.del(key);
        if (this.layer2) {
            await this.layer2.del(key);
        }
    }

    async keys(pattern?: string): Promise<string[]> {
        const keys1 = await this.layer1.keys(pattern);
        if (this.layer2) {
            const keys2 = await this.layer2.keys(pattern);
            return Array.from(new Set([...keys1, ...keys2])); // Combine and deduplicate keys
        }
        return keys1;
    }

    /**
     * Remove keys by pattern
     */
    async clear(): Promise<void> {
        await this.layer1.clear();
        if (!this.layer2) {
            await this.layer1.clear();
        }
    }

    /**
     * Key value exists
     * @param key
     * @returns
     */
    async has(key: string): Promise<boolean> {
        const exists = await this.layer1.has(key);
        if (exists) {
            return true; // If found in layer1, no need to check layer2
        }
        if (!this.layer2) {
            return false; // If no layer2, return false
        }

        const existsInLayer2 = await this.layer2.has(key);
        if (existsInLayer2) {
            return true;
        }
        return false;
    }
}

const logger = new Logger(CacheService.name);
