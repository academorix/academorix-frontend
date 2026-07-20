/**
 * @file scope-context.interface.ts
 * @module @stackra/scope/core/interfaces
 * @description The active scope context — the resolved "where am I" for the
 *   current user/session. Produced by the backend resolver and consumed on
 *   the client by `<ScopeProvider>` / `useScope()`.
 */

/**
 * A resolved scope context.
 *
 * On the client this is an opaque, server-resolved value: the app fetches
 * it (via `onScopeChange`) and stores it in `<ScopeProvider>`. The client
 * never computes it — that's the backend's job.
 */
export interface IScopeContext {
  /** Owning tenant/organization id. */
  readonly ownerId: string;
  /** The concrete scope node id this context points at. */
  readonly nodeId: string;
  /** The hierarchy level slug (e.g. `owner`, `venue`, `team`). */
  readonly level: string;
  /** The real entity id mapped to this node (e.g. a venue id). */
  readonly entityId: string;
  /** Node ids from self → root (materialized-path order, reversed). */
  readonly path: readonly string[];
  /** Level-slug → entity-id map for every ancestor (incl. self). */
  readonly ancestors: Readonly<Record<string, string>>;
  /** Whether this context is an emulation of another scope. */
  readonly emulated?: boolean;
}

/**
 * Minimal identity of a scope node — enough to resolve a full context.
 */
export interface IScopeIdentity {
  readonly ownerId: string;
  readonly level: string;
  readonly entityId: string;
}
