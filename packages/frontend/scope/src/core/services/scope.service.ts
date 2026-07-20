/**
 * @file scope.service.ts
 * @module @stackra/scope/core/services
 * @description Client scope service — the injectable in-memory store for the
 *   active scope, the switch-target node tree, and emulation state.
 *
 *   This is the client counterpart to the backend scope platform. It holds
 *   NO resolution logic and touches NO database — it delegates all
 *   data-fetching to the app-provided `IScopeDataSource` (which hits your
 *   API) and simply caches the results + notifies subscribers. Plain
 *   in-memory state (no `AsyncLocalStorage` — that's Node-only and this
 *   package ships to browsers and RN); the DI singleton is the store.
 *
 *   The service publishes state changes through two paired mechanisms:
 *   - `subscribe(listener)` — classic observer, one call per emit.
 *   - `getSnapshot()` — referentially stable snapshot, swapped on every
 *     emit. Enables `useSyncExternalStore` in the React bindings for
 *     tearing-free rendering under concurrent React.
 */

import { Injectable, Inject, Optional } from '@stackra/container';
import type { OnModuleInit } from '@stackra/contracts';

import { SCOPE_CONFIG, SCOPE_DATA_SOURCE } from '../constants';
import type {
  IScopeContext,
  IScopeDataSource,
  IScopeModuleOptions,
  IScopeNodeTreeNode,
  IScopeSnapshot,
} from '../interfaces';

/** Listener invoked whenever the scope state changes. */
export type ScopeListener = () => void;

/**
 * Client scope service.
 *
 * @example
 * ```typescript
 * const scope = app.get(SCOPE_SERVICE);
 * await scope.setScope('node-venue-123');   // switch
 * await scope.emulate('node-venue-999');    // view another scope
 * scope.restore();                          // exit emulation
 * const off = scope.subscribe(() => render());
 * ```
 */
@Injectable()
export class ScopeService implements OnModuleInit {
  private scope: IScopeContext | null;
  private tree: readonly IScopeNodeTreeNode[];
  private loading: boolean;
  private original: IScopeContext | null = null;
  private readonly listeners = new Set<ScopeListener>();

  /**
   * Cached, referentially stable snapshot. Swapped on every `emit()`
   * so `useSyncExternalStore` sees a new identity iff state changed.
   */
  private snapshot: IScopeSnapshot;

  public constructor(
    @Optional() @Inject(SCOPE_CONFIG) config?: IScopeModuleOptions,
    @Optional() @Inject(SCOPE_DATA_SOURCE) private readonly dataSource?: IScopeDataSource
  ) {
    this.scope = config?.initialScope ?? null;
    this.tree = config?.initialTree ?? [];
    this.loading = !this.scope;
    this.snapshot = this.buildSnapshot();
  }

  /** Load the tree on init when not seeded and a data source is present. */
  public async onModuleInit(): Promise<void> {
    if (this.tree.length === 0 && this.dataSource) {
      try {
        this.tree = await this.dataSource.loadTree();
      } catch {
        // fail-soft — tree load is best-effort; the app can call
        // `dataSource.loadTree()` explicitly and retry if needed.
      }
    }
    this.loading = false;
    this.emit();
  }

  // ── Reads ─────────────────────────────────────────────────────────────────

  /** The active scope context, or `null` if unresolved. */
  public getScope(): IScopeContext | null {
    return this.scope;
  }

  /** The scope tree (nodes the current user can switch to). */
  public getTree(): readonly IScopeNodeTreeNode[] {
    return this.tree;
  }

  /** Whether a scope resolution / tree load is in flight. */
  public isLoading(): boolean {
    return this.loading;
  }

  /** Whether the active scope is an emulation of another. */
  public isEmulating(): boolean {
    return this.scope?.emulated ?? false;
  }

  /**
   * A referentially stable snapshot of every observable field. The same
   * object identity is returned across calls until `emit()` swaps it,
   * which is exactly the contract `useSyncExternalStore` needs.
   */
  public getSnapshot(): IScopeSnapshot {
    return this.snapshot;
  }

  // ── Mutations ───────────────────────────────────────────────────────────────

  /**
   * Switch the active scope to a node. Resolves the full context via the
   * data source (the backend authorizes + returns path/ancestors).
   */
  public async setScope(nodeId: string): Promise<void> {
    if (!this.dataSource) return;
    this.loading = true;
    this.emit();
    try {
      const next = await this.dataSource.resolveScope(nodeId);
      if (next) {
        this.scope = next;
        this.original = null;
        this.dataSource.persist?.(next);
      }
    } finally {
      this.loading = false;
      this.emit();
    }
  }

  /**
   * Emulate a different scope node — keeps your identity, swaps the active
   * scope, and flags `emulated: true`. The current scope is stashed so
   * `restore()` can return to it. The backend still authorizes the
   * emulation via `resolveScope`.
   */
  public async emulate(nodeId: string): Promise<void> {
    if (!this.dataSource) return;
    // Stash the pre-emulation scope BEFORE the async gap so a
    // concurrent `emulate()` during resolution can't lose the anchor.
    if (this.scope && !this.scope.emulated) {
      this.original = this.scope;
    }
    this.loading = true;
    this.emit();
    try {
      const next = await this.dataSource.resolveScope(nodeId);
      if (next) {
        this.scope = { ...next, emulated: true };
      }
    } finally {
      this.loading = false;
      this.emit();
    }
  }

  /** Exit emulation and restore the pre-emulation scope. */
  public restore(): void {
    if (this.original) {
      this.scope = this.original;
      this.original = null;
      this.emit();
    }
  }

  /**
   * Resolve a cascading value for the active node + consumer namespace.
   * Requires the data source to implement `resolveValue`.
   */
  public async resolveValue<T = unknown>(namespace: string, key: string): Promise<T | null> {
    if (!this.dataSource?.resolveValue || !this.scope?.nodeId) return null;
    return this.dataSource.resolveValue<T>(this.scope.nodeId, namespace, key);
  }

  // ── Subscription ────────────────────────────────────────────────────────────

  /** Subscribe to scope state changes; returns an unsubscribe function. */
  public subscribe(listener: ScopeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // ── Private ───────────────────────────────────────────────────────────────

  /** Build a fresh snapshot from the current fields. */
  private buildSnapshot(): IScopeSnapshot {
    return {
      scope: this.scope,
      tree: this.tree,
      isLoading: this.loading,
      isEmulating: this.scope?.emulated ?? false,
    };
  }

  /**
   * Swap the cached snapshot and fan out to every subscriber. Must be
   * called any time an observable field changes so `useSyncExternalStore`
   * consumers see the new identity.
   */
  private emit(): void {
    this.snapshot = this.buildSnapshot();
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        // fail-soft — a broken subscriber must not prevent other
        // subscribers from receiving the event.
      }
    }
  }
}
