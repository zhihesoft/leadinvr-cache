export class CacheModuleOptions {
    /**
     * Redis URI
     */
    redisUrl?: string = "";

    /**
     * Default workspace
     */
    workspace: string = "default";

    /**
     * Default ttl in seconds
     */
    ttl: number = 10;
}
