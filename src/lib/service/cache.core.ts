export class CacheCoreOption {
    constructor(
        /**
         * Cache workspace. Default is "default".
         */
        public readonly workspace: string = "default",
        /**
         * Time to live in seconds for cache entries. Default is 10s
         */
        public readonly ttl: number = 10,
    ) {}
}

export abstract class CacheCore {
    constructor(public readonly options: CacheCoreOption) {}

    abstract init(): Promise<void>;
    abstract close(): Promise<void>;
    abstract has(key: string): Promise<boolean>;
    abstract get<T>(key: string): Promise<T | undefined>;
    abstract set(key: string, value: any, ttl?: number): Promise<void>;
    abstract del(key: string | string[]): Promise<void>;
    abstract clear(): Promise<void>;
    abstract keys(pattern?: string): Promise<string[]>;

    public get workspace(): string {
        return this.options.workspace || "default";
    }

    protected getKey(key: string): string {
        return `${this.workspace}:${key}`;
    }
}
