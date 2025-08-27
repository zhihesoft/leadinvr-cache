import { ConfigurableModuleBuilder } from "@nestjs/common";
import { CacheModuleOptions } from "./cache.module.options";

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } = new ConfigurableModuleBuilder<CacheModuleOptions>()
    .setExtras(
        {
            isGlobal: true,
        },
        (defination, extras) => ({
            ...defination,
            global: extras.isGlobal,
        }),
    )
    .build();
