/**
 * @file index.ts
 * @module @stackra/contracts/interfaces/config
 * @description Barrel export for the config namespace's interfaces.
 *   Standalone type aliases (`ConfigObject`, `NoInferType`, `Path`,
 *   `PathValue`, `Parser`) live under ../../types/config.
 */

export type { IConfigChangeEvent } from "./config-change-event.interface";
export type { IConfigFactory } from "./config-factory.interface";
export type { IConfigFactoryKeyHost } from "./config-factory-key-host.interface";
export type { IConfigGetOptions } from "./config-get-options.interface";
export type { IConfigModuleAsyncOptions } from "./config-module-async-options.interface";
export type { IConfigModuleOptions } from "./config-module-options.interface";
export type { IConditionalModuleOptions } from "./conditional-module-options.interface";
export type {
  IConfigService,
  IConfigDescribeEntry,
  IConfigDescribeOptions,
} from "./config-service.interface";
