/**
 * @file module-ref-get-options.interface.ts
 * @module @stackra/container/src/interfaces
 * @description IModuleRefGetOptions interface.
 */

/**
 * Resolution options accepted by {@link ModuleRef.get}.
 */
export interface IModuleRefGetOptions {
  /**
   * If `true`, returns `undefined` instead of throwing when the token
   * isn't found.
   *
   * @default false
   */
  optional?: boolean;
}
