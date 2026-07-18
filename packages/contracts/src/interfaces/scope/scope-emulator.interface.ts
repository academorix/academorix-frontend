/**
 * @file scope-emulator.interface.ts
 * @module @stackra/contracts/interfaces/scope
 * @description Contract for the scope emulation service.
 */

import type { IScopeContext } from "./scope-context.interface";
import type { IScopeIdentity } from "./scope-identity.interface";

/**
 * Scope emulator contract.
 *
 * Enables temporarily switching the active scope context for an isolated
 * execution block. All code within the callback observes the emulated
 * context; code outside continues to observe the original.
 *
 * @example
 * ```typescript
 * const result = await scopeEmulator.runInScope(
 *   { ownerId: 'org-abc', level: 'venue', entityId: 'venue-123' },
 *   async () => productService.findAll(),
 * );
 * ```
 */
export interface IScopeEmulator {
  /**
   * Execute a callback within an emulated scope context.
   *
   * The target identity is resolved to a full {@link IScopeContext}
   * (with path, ancestors, ...) before execution. The emulated context
   * has `emulated: true` set.
   *
   * @param target - Minimal identity of the target scope node.
   * @param fn - Async callback to execute in the emulated scope.
   * @returns The callback's return value.
   */
  runInScope<T>(target: IScopeIdentity, fn: () => Promise<T>): Promise<T>;

  /**
   * Whether the current execution context is emulated.
   */
  isEmulating(): boolean;

  /**
   * Get the original (non-emulated) scope context.
   *
   * Only meaningful when called within a `runInScope()` callback.
   * Returns `null` when not emulating.
   */
  getOriginalContext(): IScopeContext | null;
}
