/**
 * @file scope-context-store.interface.ts
 * @module @stackra/contracts/interfaces/scope
 * @description Contract for the scope context storage service.
 */

import type { IScopeContext } from "./scope-context.interface";

/**
 * Contract for the scope context storage service.
 *
 * Stores and retrieves the active {@link IScopeContext} for the current
 * execution context. On Node.js uses `AsyncLocalStorage`; on the frontend
 * delegates to React Context via the `ScopeProvider`.
 */
export interface IScopeContextStore {
  /**
   * Get the current scope context, or `null` if not set.
   */
  get(): IScopeContext | null;

  /**
   * Get the current scope context; throws if not set.
   *
   * @throws When no context is available.
   */
  getOrFail(): IScopeContext;

  /**
   * Run a callback with a specific scope context.
   *
   * Creates an isolated execution context where `get()` returns the
   * provided context. Used by scope-resolution middleware and the
   * scope emulator.
   *
   * @param context - Scope context to activate.
   * @param fn - Callback to execute within the context.
   * @returns The callback's return value.
   */
  run<T>(context: IScopeContext, fn: () => T): T;
}
