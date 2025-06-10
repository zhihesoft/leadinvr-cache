import { CacheCore, CacheCoreOption } from "./cache.core";

class MemoryCacheItem {
    constructor(
        public key: string,
        public value: unknown,
        public expiresAt: number,
        public fetchedAt: number,
    ) {}

    clone(): MemoryCacheItem {
        const newItem = JSON.parse(JSON.stringify(this)); // Deep clone the item
        return new MemoryCacheItem(
            newItem.key,
            newItem.value,
            newItem.expiresAt,
            newItem.fetchedAt,
        );
    }
}

export class MemoryCacheOption extends CacheCoreOption {
    constructor(
        public readonly workspace: string = "default",
        public readonly ttl: number = 10, // Default TTL in seconds
        public readonly maxSize: number = 1000, // Maximum size of the cache
    ) {
        super(workspace, ttl);
    }
}

export class MemoryCache extends CacheCore {
    constructor(options: MemoryCacheOption) {
        super(options);
        this.maxSize = options.maxSize || 1000;
    }

    private readonly maxSize: number;
    private readonly entries: Map<string, MemoryCacheItem> = new Map();

    init(): Promise<void> {
        // Memory cache does not require any initialization
        return Promise.resolve();
    }

    close(): Promise<void> {
        this.entries.clear();
        return Promise.resolve();
    }

    keys(pattern?: string): Promise<string[]> {
        const keys = Array.from(this.entries.keys());
        if (!pattern) {
            return Promise.resolve(keys);
        }
        const regex = new RegExp(pattern);

        return Promise.resolve(
            keys
                .filter(key => regex.test(key))
                .map(key => key.replace(`${this.options.workspace}:`, "")),
        );
    }
    has(key: string): Promise<boolean> {
        key = this.getKey(key);
        const entry = this.entries.get(key);
        if (!entry || entry.expiresAt < Date.now()) {
            this.entries.delete(key);
            return Promise.resolve(false);
        }
        return Promise.resolve(true);
    }
    get<T>(key: string): Promise<T | undefined> {
        const entry = this.entries.get(this.getKey(key));
        if (!entry) {
            return Promise.resolve(undefined);
        }
        if (entry.expiresAt < Date.now()) {
            this.entries.delete(this.getKey(key));
            return Promise.resolve(undefined);
        }

        entry.fetchedAt = Date.now();
        const clone = entry.clone(); // Deep clone the value
        return Promise.resolve(clone.value as T);
    }
    set(key: string, value: unknown, ttl?: number): Promise<void> {
        ttl = ttl || this.options.ttl;
        key = this.getKey(key);
        const expiresAt = Date.now() + ttl * 1000;
        const item = new MemoryCacheItem(key, value, expiresAt, Date.now());
        this.entries.set(key, item.clone());
        this.shrinkCache();
        return Promise.resolve();
    }
    del(key: string | string[]): Promise<void> {
        const arr = Array.isArray(key) ? key : [key];
        arr.forEach(k => {
            this.entries.delete(this.getKey(k));
        });
        return Promise.resolve();
    }
    clear(): Promise<void> {
        this.entries.clear();
        return Promise.resolve();
    }

    private shrinkCache(): void {
        if (this.entries.size < this.maxSize) {
            return;
        }

        const sortedEntries = Array.from(this.entries.values()).sort(
            (a, b) => a.fetchedAt - b.fetchedAt,
        );

        const items = sortedEntries.slice(sortedEntries.length / 2);
        this.entries.clear();
        items.forEach(item => {
            this.entries.set(item.key, item.clone());
        });
    }
}
