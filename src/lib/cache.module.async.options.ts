import { CacheModuleOptions } from "./cache.module.options";

export class CacheModuleAsyncOptions {
  global?: boolean;
  imports?: any[];
  inject?: any[];
  useFactory?: (
    ...args: any[]
  ) => Promise<CacheModuleOptions> | CacheModuleOptions;
}
