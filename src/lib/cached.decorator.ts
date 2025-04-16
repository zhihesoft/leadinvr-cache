import { applyDecorators, SetMetadata, UseInterceptors } from "@nestjs/common";
import { CacheRevokeInterceptor } from "./cache.revoke.interceptor";
import { CACHE_NAME_KEY, CachedInterceptor } from "./cached.interceptor";

export function Cached(cacheName: string, ttl: number | string | undefined = "10m") {
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
        SetMetadata(CACHE_NAME_KEY, {
            name: cacheName,
            ttl: 0,
        }),
        UseInterceptors(CacheRevokeInterceptor),
    );
}
