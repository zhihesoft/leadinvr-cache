import { applyDecorators, SetMetadata, UseInterceptors } from "@nestjs/common";
import { CacheRevokeInterceptor } from "./cache.revoke.interceptor";
import { CachedInterceptor } from "./cached.interceptor";

export const CACHE_NAME_KEY = "CACHE_NAME_KEY";
export const CACHE_REVOKE_KEY = "CACHE_REVOKE_KEY";

export function Cached(
    cacheName: string,
    ttl: number | string | undefined = "10s",
) {
    return applyDecorators(
        SetMetadata(CACHE_NAME_KEY, {
            name: cacheName,
            ttl: ttl,
        }),
        UseInterceptors(CachedInterceptor),
    );
}

export function RevokeCache(cacheName: string) {
    return applyDecorators(
        SetMetadata(CACHE_REVOKE_KEY, {
            name: cacheName,
            ttl: 0,
        }),
        UseInterceptors(CacheRevokeInterceptor),
    );
}
