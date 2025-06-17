import KeyvRedis, {
    KeyvRedisOptions,
    RedisClientConnectionType,
    RedisClientOptions,
    RedisClusterOptions,
} from "@keyv/redis";

export class RedisStorage extends KeyvRedis<unknown> {
    constructor(
        connect?:
            | string
            | RedisClientOptions
            | RedisClusterOptions
            | RedisClientConnectionType,
        options?: KeyvRedisOptions,
    ) {
        super(connect, options);
    }

    async delete(pattern: string): Promise<boolean> {
        if (pattern.includes("*") || pattern.includes("?")) {
            const regex = new RegExp(pattern);
            const deleteKeys: string[] = [];
            for await (const item of this.iterator(this.namespace)) {
                if (regex.test(item[0])) {
                    deleteKeys.push(item[0]);
                }
            }
            await this.deleteMany(deleteKeys);
            return deleteKeys.length > 0;
        } else {
            return super.delete(pattern);
        }
    }
}
