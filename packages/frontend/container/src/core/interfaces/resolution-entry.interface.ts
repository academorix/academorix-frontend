/**
 * @file resolution-entry.interface.ts
 * @module @stackra/container/src/interfaces
 * @description A single provider resolution log entry.
 */

/**
 * A single provider resolution entry logged during bootstrap.
 */
export interface IResolutionEntry {
  /** Module the provider belongs to. */
  module?: string;
  /** Provider class/token name. */
  name?: string;
  /** Provider name (alias). */
  provider?: string;
  /** Scope of the provider (singleton, transient, request). */
  scope?: string;
  /** List of dependency names. */
  dependencies?: string[];
  /** Duration in milliseconds. */
  durationMs?: number;
  /** Performance.now() timestamp. */
  time?: number;
  /** Whether resolution succeeded. */
  success?: boolean;
  /** Allow additional properties. */
  [key: string]: unknown;
}
