/**
 * @file cache-module-async-options.interface.ts
 * @module @stackra/cache/src/interfaces
 * @description Async configuration options for
 *   `CacheModule.forRootAsync()`. Aliases the canonical
 *   `IConfigModuleAsyncOptions<T>` from `@stackra/contracts` so
 *   `.asProvider()` output from a `registerAs('cache', () => …)`
 *   factory slots in verbatim.
 */

import type { IConfigModuleAsyncOptions } from "@stackra/contracts";
import type { ICacheModuleConfig } from "./cache-config.interface";

/** Async configuration options for `CacheModule.forRootAsync()`. */
export interface ICacheModuleAsyncOptions extends IConfigModuleAsyncOptions<ICacheModuleConfig> {}
