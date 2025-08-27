import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, of, switchMap } from "rxjs";
import { CacheService } from "./cache.service";
import { CACHE_NAME_KEY } from "./cached.decorator";
import { CachedMeta } from "./cached.meta";

@Injectable()
export class CachedInterceptor implements NestInterceptor {
    constructor(
        private readonly cache: CacheService,
        private readonly reflector: Reflector,
    ) {}

    async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
        const req = context.switchToHttp().getRequest();

        // only cache GET and DELETE requests
        const method = String(req.method).toUpperCase();
        if (method !== "GET" && method !== "DELETE") {
            return next.handle();
        }

        const cachedMeta: CachedMeta = this.reflector.get(CACHE_NAME_KEY, context.getHandler());
        if (!cachedMeta?.name) {
            return next.handle();
        }

        // 使用 matchAll（推荐，Node.js 10+）
        const regex = /\{([^}]*)\}/g;
        const matches: string[] = [];
        for (const match of cachedMeta.name.matchAll(regex)) {
            matches.push(match[1]); // match[1] 获取捕获组内容
        }

        // 替换匹配的参数
        let key = cachedMeta.name;
        for (const element of matches) {
            let v = "";
            if (element.startsWith("req.")) {
                v = this.getPropertyValue(req, element.slice(4));
            } else if (element.startsWith("query.")) {
                v = req.query[element.slice(6)];
            }
            if (v && v.length > 0) {
                key = key.replace(`{${element}}`, String(v));
            }
        }

        if (await this.cache.has(key)) {
            const hit = await this.cache.get(key);
            return of(hit);
        }

        return next.handle().pipe(
            switchMap(async data => {
                await this.cache.set(key, data, cachedMeta.ttl);
                return data;
            }),
        );
    }

    private getPropertyValue(obj: unknown, property: string): any {
        if (typeof obj !== "object" || obj === null) {
            return undefined;
        }
        const keys = property.split(".");
        let value: any = obj;
        for (const key of keys) {
            if (value && key in value) {
                value = value[key];
            } else {
                return undefined;
            }
        }
        return value;
    }
}
