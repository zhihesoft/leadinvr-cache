import { Module } from "@nestjs/common";
import { ConfigurableModuleClass } from "./cache.module-defination";
import { CacheService } from "./lib/cache.service";

@Module({
    providers: [CacheService],
    exports: [CacheService],
})
export class CacheModule extends ConfigurableModuleClass {}
