import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { from, Observable, of, switchMap } from "rxjs";
import { CacheService } from "./cache.service";
import { CACHE_NAME_KEY } from "./cached.decorator";
import { CachedMeta } from "./cached.meta";

@Injectable()
export class CachedInterceptor implements NestInterceptor {
    constructor(
        private readonly cache: CacheService,
        private readonly reflector: Reflector,
    ) {}

    async intercept(
        context: ExecutionContext,
        next: CallHandler<any>,
    ): Promise<Observable<any>> {
        const req = context.switchToHttp().getRequest();
        // only cache GET and DELETE requests
        const method = String(req.method).toUpperCase();
        if (method !== "GET") {
            return next.handle();
        }

        const cachedMeta: CachedMeta = this.reflector.get(
            CACHE_NAME_KEY,
            context.getHandler(),
        );
        if (!cachedMeta?.name) {
            return next.handle();
        }

        let key = `${cachedMeta.name}`;

        if (await this.cache.has(key)) {
            const hit = await this.cache.get(key);
            return of(hit);
        }

        return next.handle().pipe(
            switchMap(data =>
                from(
                    (async data => {
                        await this.cache.set(key, data, cachedMeta.ttl);
                        return data;
                    })(data),
                ),
            ),
            // tap(data => {
            //     this.cache.set(key, data, cachedMeta.ttl).catch(err => {
            //         throw err;
            //     });
            // }),
        );
    }
}
