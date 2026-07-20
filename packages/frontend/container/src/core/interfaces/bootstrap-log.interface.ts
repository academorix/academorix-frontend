/**
 * @file bootstrap-log.interface.ts
 * @module @stackra/container/src/interfaces
 * @description Full bootstrap log structure.
 */

import type { IResolutionEntry } from "./resolution-entry.interface";
import type { ILifecycleEntry } from "./lifecycle-entry.interface";

/**
 * Full bootstrap log structure returned by ContainerLogger.getLog().
 */
export interface IBootstrapLog {
  /** Registered modules. */
  modules: Array<{
    name: string;
    global?: boolean;
    isGlobal?: boolean;
    providers?: string[];
    durationMs?: number;
    imports?: string[];
    [key: string]: unknown;
  }>;
  /** Provider resolution entries. */
  resolutions: IResolutionEntry[];
  /** Lifecycle hook entries. */
  lifecycle: ILifecycleEntry[];
  /** Total bootstrap time in ms. */
  totalDurationMs?: number;
  /** Total time alias. */
  totalTime?: number;
  /** Allow additional properties. */
  [key: string]: unknown;
}
