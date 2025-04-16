import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, of, tap } from "rxjs";
import { CacheService } from "./cache.service";
import { CachedMeta } from "./cached.meta";

export const CACHE_NAME_KEY = "cacheName";

@Injectable()
export class CachedInterceptor implements NestInterceptor {
    constructor(private readonly cache: CacheService, private readonly reflector: Reflector) {}

    async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
        const cachedMeta: CachedMeta = this.reflector.get(CACHE_NAME_KEY, context.getHandler());
        if (!cachedMeta?.name) {
            return next.handle();
        }

        const req = context.switchToHttp().getRequest();
        // only cache GET requests
        if (req.method !== "GET") {
            return next.handle();
        }

        let key = `cache:${cachedMeta.name}`;

        // get req query params
        if (cachedMeta.name.endsWith(":")) {
            const queryParams = req.query;
            const query = new URLSearchParams(queryParams).toString();
            if (query && query.length > 0) {
                key = `${key}:${query}`;
            }
        }

        if (await this.cache.has(key)) {
            const hit = await this.cache.get(key);
            return of(hit);
        }

        return next.handle().pipe(
            tap(data => {
                this.cache.set(key, data, cachedMeta.ttl).catch(err => {
                    throw err;
                });
            }),
        );
    }
}
