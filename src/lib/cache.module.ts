import { DynamicModule, Provider } from "@nestjs/common";
import { CacheModuleAsyncOptions } from "./cache.module.async.options";
import { CACHE_MODULE_OPTIONS } from "./cache.module.constants";
import { CacheModuleOptions } from "./cache.module.options";
import { CacheService } from "./cache.service";

export class CacheModule {
    static register(options: CacheModuleOptions, global?: boolean): DynamicModule {
        global = global || false;

        return {
            global,
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
            global: options.global || false,
            module: CacheModule,
            imports: options.imports || [],
            providers,
            exports: [CacheService],
        };
    }
}
