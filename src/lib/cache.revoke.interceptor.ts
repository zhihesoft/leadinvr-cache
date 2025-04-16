import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, tap } from "rxjs";
import { CacheService } from "./cache.service";
import { CachedMeta } from "./cached.meta";

export const CACHE_NAME_KEY = "cacheName";

@Injectable()
export class CacheRevokeInterceptor implements NestInterceptor {
    constructor(private readonly cache: CacheService, private readonly reflector: Reflector) {}

    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
        const cachedMeta: CachedMeta = this.reflector.get(CACHE_NAME_KEY, context.getHandler());
        return next.handle().pipe(
            tap(() => {
                if (cachedMeta?.name) {
                    const key = `cache:${cachedMeta.name}`;
                    this.cache.remove(key).catch(err => {
                        throw err;
                    });
                }
            }),
        );
    }
}
