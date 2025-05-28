import { CacheModuleOptions } from "./cache.module.options";

/**
 * 同步创建缓存模块的选项
 * @module CacheModuleSyncOptions
 * @description 同步创建缓存模块的选项
 */
export class CacheModuleSyncOptions extends CacheModuleOptions {
    /**
     * 是否全局模块
     */
    isGlobal?: boolean;
}
