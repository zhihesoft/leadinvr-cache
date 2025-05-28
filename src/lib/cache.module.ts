import { DynamicModule, Provider } from "@nestjs/common";
import { CACHE_MODULE_OPTIONS } from "./cache.module.constants";
import { CacheModuleAsyncOptions } from "./data/cache.module.async.options";
import { CacheModuleSyncOptions } from "./data/cache.module.sync.options";
import { CacheService } from "./service/cache.service";

export class CacheModule {
    static register(options: CacheModuleSyncOptions): DynamicModule {
        return {
            global: options.isGlobal || true,
            module: CacheModule,
            providers: [
                {
                    provide: CACHE_MODULE_OPTIONS,
                    useValue: options,
                },
                CacheService,
            ],
            exports: [CacheService],
        };
    }

    /**
     * Async register
     * @param options
     * @returns
     */
    static registerAsync(options: CacheModuleAsyncOptions): DynamicModule {
        const providers: Provider[] = [];

        if (options.useFactory) {
            providers.push({
                provide: CACHE_MODULE_OPTIONS,
                useFactory: options.useFactory,
                inject: options.inject || [],
            });
        }

        providers.push(CacheService);

        return {
            global: options.isGlobal || true,
            module: CacheModule,
            imports: options.imports || [],
            providers,
            exports: [CacheService],
        };
    }
}
