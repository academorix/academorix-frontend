/**
 * @file ai-context-frame.interface.ts
 * @module @stackra/contracts/interfaces/ai
 * @description A named snapshot of UI state contributed by a mounted
 *   component via `useAiContextFrame`.
 */

/** A UI context frame contributed while its host component is mounted. */
export interface IAiContextFrame {
  /** Frame key, e.g. `drawer:order`, `popup:customer`. */
  key: string;
  /** Arbitrary snapshot data; PII-redacted before sync. */
  snapshot: unknown;
  /** Ordering weight (default 0). */
  priority: number;
  /** Namespacing for multiple instances. */
  scope?: string;
  /** Mount order, assigned by the registry. */
  seq: number;
}
