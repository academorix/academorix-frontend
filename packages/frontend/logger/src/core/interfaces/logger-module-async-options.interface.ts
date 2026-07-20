/**
 * @file logger-module-async-options.interface.ts
 * @module @stackra/logger/core/interfaces
 * @description Async configuration options for `LoggerModule.forRootAsync()`.
 *   Extends the canonical `IAsyncModuleOptions<T>` from `@stackra/contracts`.
 */

import type { IAsyncModuleOptions, ILoggerModuleConfig } from "@stackra/contracts";

/** Async options for `LoggerModule.forRootAsync()`. */
export interface ILoggerModuleAsyncOptions extends IAsyncModuleOptions<ILoggerModuleConfig> {}
