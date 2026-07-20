/**
 * @file define-config.util.ts
 * @module @stackra/devtools/core/utils
 * @description Typed identity for authoring a `devtools.config.ts`
 *   file.
 */

import type { IDevtoolsModuleOptions } from '../interfaces/devtools-module-options.interface';

/**
 * Type-safe devtools configuration helper — identity pass-through
 * for inference + IDE autocompletion.
 *
 * @example
 * ```typescript
 * import { defineConfig } from '@stackra/devtools';
 *
 * export const devtoolsConfig = defineConfig({
 *   position: 'bottom',
 *   initialSize: 640,
 *   shortcut: { meta: true, shift: true, key: 'd' },
 * });
 * ```
 */
export function defineConfig(config: IDevtoolsModuleOptions): IDevtoolsModuleOptions {
  return config;
}
