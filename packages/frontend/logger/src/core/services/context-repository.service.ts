/**
 * @file context-repository.service.ts
 * @module @stackra/logger/core/services
 * @description Contextual data repository for log enrichment.
 *   Maintains a key-value store of context data that is automatically
 *   injected into every log entry via the ContextEnricher.
 *
 *   This is the BASE implementation using a simple in-memory Map.
 *   Suitable for single-user environments (browser, React Native).
 *
 *   In NestJS, the AsyncContextRepository extends this class and delegates
 *   request-scoped data to AsyncLocalStorage so concurrent requests are
 *   isolated. Global context (shared across all requests) stays in the base
 *   Map from this class.
 */

import { Injectable } from "@stackra/container";
import type { LogContext } from "@stackra/contracts";

/**
 * Context repository — stores contextual data merged into every log entry.
 *
 * Provides a mutable key-value store that the ContextEnricher reads from
 * during the enrichment pipeline. Supports visible context (appears in logs)
 * and hidden context (available for routing/filtering but not serialized).
 *
 * The `scope()` method executes callbacks with temporary context that is
 * automatically cleaned up on completion.
 *
 * In server environments (NestJS), use the `AsyncContextRepository` subclass
 * which isolates request-scoped context via AsyncLocalStorage.
 *
 * @example
 * ```typescript
 * // Browser/React Native — single user, safe to use directly
 * const repo = container.get(ContextRepository);
 * repo.add('ownerId', 'abc-123');
 * repo.add('locale', 'en');
 *
 * // All log entries now include {ownerId: 'abc-123', locale: 'en' }
 *
 * repo.scope(() => {
 *   repo.add('transactionId', 'tx-789');
 *   // Logs within this callback include transactionId
 * });
 * // transactionId is automatically removed here
 * ```
 */
@Injectable()
export class ContextRepository {
  /** Visible context data — serialized into log entry meta. */
  protected data: Map<string, unknown> = new Map();

  /** Hidden context data — available for internal use but not serialized to reporters. */
  protected hiddenData: Map<string, unknown> = new Map();

  // ══════════════════════════════════════════════════════════════════════════
  // Visible Context
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Add a key-value pair to the visible context.
   *
   * @param key - Context key
   * @param value - Context value
   */
  public add(key: string, value: unknown): void {
    this.getDataStore().set(key, value);
  }

  /**
   * Get a value from the visible context.
   *
   * @param key - Context key to retrieve
   * @returns The value or undefined if not set
   */
  public get(key: string): unknown | undefined {
    return this.getDataStore().get(key);
  }

  /**
   * Check if a key exists in the visible context.
   *
   * @param key - Context key to check
   * @returns True if the key exists
   */
  public has(key: string): boolean {
    return this.getDataStore().has(key);
  }

  /**
   * Remove a key from the visible context.
   *
   * @param key - Context key to remove
   */
  public forget(key: string): void {
    this.getDataStore().delete(key);
  }

  /**
   * Push one or more values onto an array stored at the given key.
   * Creates the array if it does not exist.
   *
   * @param key - Context key (value will be treated as an array)
   * @param values - Values to append
   */
  public push(key: string, ...values: unknown[]): void {
    const store = this.getDataStore();
    const existing = store.get(key);
    const arr = Array.isArray(existing) ? existing : [];
    arr.push(...values);
    store.set(key, arr);
  }

  /**
   * Pop the last value from an array stored at the given key.
   *
   * @param key - Context key (value must be an array)
   * @returns The popped value or undefined
   */
  public pop(key: string): unknown | undefined {
    const existing = this.getDataStore().get(key);
    if (Array.isArray(existing)) {
      return existing.pop();
    }
    return undefined;
  }

  /**
   * Get all visible context as a plain object.
   * Merges the base (global) context with request-scoped context.
   *
   * @returns Snapshot of all visible context key-value pairs
   */
  public all(): LogContext {
    const result: LogContext = {};
    for (const [key, value] of this.getDataStore()) {
      result[key] = value;
    }
    return result;
  }

  /**
   * Remove all visible and hidden context data.
   */
  public flush(): void {
    this.getDataStore().clear();
    this.getHiddenStore().clear();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Hidden Context
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Add a key-value pair to the hidden context.
   * Hidden context is not serialized to log reporters.
   *
   * @param key - Context key
   * @param value - Context value
   */
  public addHidden(key: string, value: unknown): void {
    this.getHiddenStore().set(key, value);
  }

  /**
   * Get a hidden context value.
   *
   * @param key - Context key to retrieve
   * @returns The value or undefined
   */
  public getHidden(key: string): unknown | undefined {
    return this.getHiddenStore().get(key);
  }

  /**
   * Get all hidden context as a plain object.
   *
   * @returns Snapshot of all hidden context key-value pairs
   */
  public allHidden(): LogContext {
    const result: LogContext = {};
    for (const [key, value] of this.getHiddenStore()) {
      result[key] = value;
    }
    return result;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Scoped Context
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Execute a callback with temporary context that is cleaned up on completion.
   * Restores the previous context state after the callback finishes (or throws).
   *
   * @param callback - Function to execute within the scoped context
   * @param data - Visible context to add for the duration of the scope
   * @param hidden - Hidden context to add for the duration of the scope
   * @returns The return value of the callback
   */
  public scope<T>(callback: () => T, data?: LogContext, hidden?: LogContext): T {
    const store = this.getDataStore();
    const hiddenStore = this.getHiddenStore();

    // Snapshot current state
    const prevData = new Map(store);
    const prevHidden = new Map(hiddenStore);

    // Apply scoped context
    if (data) {
      for (const [key, value] of Object.entries(data)) {
        store.set(key, value);
      }
    }
    if (hidden) {
      for (const [key, value] of Object.entries(hidden)) {
        hiddenStore.set(key, value);
      }
    }

    try {
      return callback();
    } finally {
      // Restore previous state — clear and re-populate
      store.clear();
      for (const [key, value] of prevData) {
        store.set(key, value);
      }
      hiddenStore.clear();
      for (const [key, value] of prevHidden) {
        hiddenStore.set(key, value);
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Protected — Store Access (overridden by AsyncContextRepository)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Get the active data store for the current context.
   * Base implementation returns the instance-level Map.
   * Subclasses (AsyncContextRepository) override to return request-scoped stores.
   *
   * @returns The Map to use for visible context operations
   */
  protected getDataStore(): Map<string, unknown> {
    return this.data;
  }

  /**
   * Get the active hidden data store for the current context.
   * Base implementation returns the instance-level Map.
   * Subclasses override for request-scoped isolation.
   *
   * @returns The Map to use for hidden context operations
   */
  protected getHiddenStore(): Map<string, unknown> {
    return this.hiddenData;
  }
}
