/**
 * @file listener-entry.interface.ts
 * @module @stackra/events/core/interfaces
 * @description Internal listener entry interface.
 */

/** A listener callback function that accepts any arguments. */
export type EventListener = (...args: any[]) => any;

/**
 * Internal listener entry with metadata.
 */
export interface IListenerEntry {
  /** The callback function. */
  fn: EventListener;
  /** Whether to remove the entry after first invocation. */
  once: boolean;
}
