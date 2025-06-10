import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, switchMap } from "rxjs";
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
            switchMap(async data => {
                const keys = await this.cache.keys(cachedMeta.name);
                await this.cache.remove(keys);
                return data;
            }),
        );
    }
}
