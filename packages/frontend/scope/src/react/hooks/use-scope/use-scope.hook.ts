/**
 * @file use-scope.hook.ts
 * @module @stackra/scope/react/hooks
 * @description Access the active scope + control methods, backed by the DI
 *   `ScopeService` (resolved via `useInject`) with a live subscription via
 *   React's `useSyncExternalStore`.
 *
 *   `useSyncExternalStore` guarantees tearing-free reads under concurrent
 *   React by requiring a referentially stable snapshot; the service's
 *   `getSnapshot()` returns a cached object that is only replaced when
 *   state changes, satisfying that contract.
 */

import { useCallback, useSyncExternalStore } from "react";
import { useInject } from "@stackra/container/react";
import { SCOPE_SERVICE } from "@/core/constants";
import type { ScopeService } from "@/core/services";
import type { IScopeContext, IScopeNodeTreeNode } from "@/core/interfaces";

/** Value returned by {@link useScope}. */
export interface UseScopeResult {
  /** Active scope context (null until resolved). */
  readonly scope: IScopeContext | null;
  /** Scope tree (nodes the current user can switch to). */
  readonly tree: readonly IScopeNodeTreeNode[];
  /** Whether a resolution / tree load is in flight. */
  readonly isLoading: boolean;
  /** Whether the active scope is an emulation. */
  readonly isEmulating: boolean;
  /** Switch to a different scope node. */
  readonly setScope: (nodeId: string) => Promise<void>;
  /** Emulate a different scope node (keeps identity). */
  readonly emulate: (nodeId: string) => Promise<void>;
  /** Exit emulation and restore the previous scope. */
  readonly restore: () => void;
}

/**
 * Access the active scope context, tree, and control methods.
 *
 * @example
 * ```tsx
 * function ScopeIndicator() {
 *   const { scope, isLoading, setScope } = useScope();
 *   if (isLoading) return <Spinner />;
 *   return <span>{scope?.level}: {scope?.entityId}</span>;
 * }
 * ```
 */
export function useScope(): UseScopeResult {
  const service = useInject<ScopeService>(SCOPE_SERVICE);

  // Wrap the service methods in useCallback bound to the resolved
  // singleton so the subscribe / getSnapshot identities stay stable
  // across renders — required by useSyncExternalStore.
  const subscribe = useCallback((cb: () => void) => service.subscribe(cb), [service]);
  const getSnapshot = useCallback(() => service.getSnapshot(), [service]);

  // Third argument (server snapshot) uses the same function: the DI
  // container is scoped per app instance, so SSR sees whatever the
  // `initialScope` seed provided — the snapshot is safe to read on
  // both sides of the hydration boundary.
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const setScope = useCallback((nodeId: string) => service.setScope(nodeId), [service]);
  const emulate = useCallback((nodeId: string) => service.emulate(nodeId), [service]);
  const restore = useCallback(() => service.restore(), [service]);

  return {
    scope: state.scope,
    tree: state.tree,
    isLoading: state.isLoading,
    isEmulating: state.isEmulating,
    setScope,
    emulate,
    restore,
  };
}
