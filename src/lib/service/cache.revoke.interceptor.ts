import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { from, Observable, switchMap } from "rxjs";
import { CacheService } from "./cache.service";
import { CACHE_REVOKE_KEY } from "./cached.decorator";
import { CachedMeta } from "./cached.meta";

@Injectable()
export class CacheRevokeInterceptor implements NestInterceptor {
    constructor(
        private readonly cache: CacheService,
        private readonly reflector: Reflector,
    ) {}

    intercept(
        context: ExecutionContext,
        next: CallHandler<any>,
    ): Observable<any> | Promise<Observable<any>> {
        const cachedMeta: CachedMeta = this.reflector.get(
            CACHE_REVOKE_KEY,
            context.getHandler(),
        );

        return next.handle().pipe(
            switchMap(data =>
                from(
                    (async data => {
                        const key = cachedMeta.name;
                        await this.cache.remove(key);
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

        // return next.handle().pipe(
        //     tap(() => {
        //         if (cachedMeta?.name) {
        //             const key = cachedMeta.name;
        //             this.cache.remove(key).catch(err => {
        //                 throw err;
        //             });
        //         }
        //     }),
        // );
    }
}
