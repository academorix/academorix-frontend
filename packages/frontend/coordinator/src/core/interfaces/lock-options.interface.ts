/**
 * @file lock-options.interface.ts
 * @module @stackra/coordinator/src/interfaces
 * @description ILockOptions interface.
 */

/**
 * Options for lock acquisition.
 */
export interface ILockOptions {
  /** Max time to wait for acquisition in ms. @default 30000 */
  timeoutMs?: number;
}
