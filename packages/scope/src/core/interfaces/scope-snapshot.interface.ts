/**
 * @file scope-snapshot.interface.ts
 * @module @stackra/scope/core/interfaces
 * @description Immutable snapshot of the client scope state — the shape
 *   returned by `ScopeService.getSnapshot()` and consumed by React's
 *   `useSyncExternalStore` inside `useScope()`.
 *
 *   The snapshot object is referentially stable between emits: the
 *   service returns the *same* object identity every call until state
 *   changes, then swaps in a new one. That contract is what lets
 *   `useSyncExternalStore` avoid re-render tearing under concurrent
 *   rendering.
 */

import type { IScopeContext } from './scope-context.interface';
import type { IScopeNodeTreeNode } from './scope-node-tree-node.interface';

/**
 * A referentially stable snapshot of the scope service's observable state.
 *
 * The service replaces this object on every state change; readers should
 * treat it as immutable and never mutate any field.
 */
export interface IScopeSnapshot {
  /** Active scope context, or `null` while unresolved. */
  readonly scope: IScopeContext | null;
  /** The current scope tree (instances the user can switch to). */
  readonly tree: readonly IScopeNodeTreeNode[];
  /** Whether a resolution / tree load is in flight. */
  readonly isLoading: boolean;
  /** Whether the active scope is an emulation of another. */
  readonly isEmulating: boolean;
}
