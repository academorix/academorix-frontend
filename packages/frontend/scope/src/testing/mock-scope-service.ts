/**
 * @file mock-scope-service.ts
 * @module @stackra/scope/testing
 * @description In-memory `ScopeService`-shaped mock for tests.
 *
 *   Owns an in-memory active scope + node tree, no data source required.
 *   Test hooks (`simulateScope`, `simulateTree`, `simulateLoading`) drive
 *   state without going through the real backend contract.
 */

import type { IScopeContext, IScopeNodeTreeNode, IScopeSnapshot } from "../core/interfaces";
import type { ScopeListener } from "../core/services";

/**
 * In-memory scope service for testing.
 *
 * Mirrors the public API of the real `ScopeService` (`getScope`,
 * `getTree`, `getSnapshot`, `isLoading`, `isEmulating`, `setScope`,
 * `emulate`, `restore`, `resolveValue`, `subscribe`) — so it can be
 * registered under `SCOPE_SERVICE` in tests as a drop-in.
 *
 * @example
 * ```ts
 * const service = new MockScopeService({
 *   scope: {
 *     ownerId: 'owner-1',
 *     nodeId: 'node-venue-1',
 *     level: 'venue',
 *     entityId: 'venue-1',
 *     path: ['node-venue-1', 'node-owner-1'],
 *     ancestors: { owner: 'owner-1', venue: 'venue-1' },
 *   },
 * });
 * expect(service.getScope()?.entityId).toBe('venue-1');
 * ```
 */
export class MockScopeService {
  /** Current active scope. */
  private scope: IScopeContext | null;

  /** Scope tree (switchable nodes). */
  private tree: readonly IScopeNodeTreeNode[];

  /** Whether the mock reports a loading state. */
  private loading = false;

  /** Pre-emulation scope, if any. */
  private originalScope: IScopeContext | null = null;

  /** Scope resolver — optional. If unset, `setScope` is a no-op. */
  private readonly resolveFn?: (nodeId: string) => IScopeContext | null;

  /** Cascading value resolver — optional. */
  private readonly valueResolver?: (nodeId: string, ns: string, key: string) => unknown;

  /** Registered listeners. */
  private readonly listeners = new Set<ScopeListener>();

  /** Cached snapshot, matches ScopeService.getSnapshot semantics. */
  private snapshot: IScopeSnapshot;

  public constructor(initial?: {
    /** Seed active scope. */
    scope?: IScopeContext | null;
    /** Seed switchable node tree. */
    tree?: readonly IScopeNodeTreeNode[];
    /** Seed loading flag. */
    loading?: boolean;
    /** Custom scope resolver — called by `setScope` / `emulate`. */
    resolveScope?: (nodeId: string) => IScopeContext | null;
    /** Custom value resolver — called by `resolveValue`. */
    resolveValue?: (nodeId: string, ns: string, key: string) => unknown;
  }) {
    this.scope = initial?.scope ?? null;
    this.tree = initial?.tree ?? [];
    this.loading = initial?.loading ?? false;
    this.resolveFn = initial?.resolveScope;
    this.valueResolver = initial?.resolveValue;
    this.snapshot = this.buildSnapshot();
  }

  // ── Reads ─────────────────────────────────────────────────────────────

  public getScope(): IScopeContext | null {
    return this.scope;
  }

  public getTree(): readonly IScopeNodeTreeNode[] {
    return this.tree;
  }

  public isLoading(): boolean {
    return this.loading;
  }

  public isEmulating(): boolean {
    return this.scope?.emulated ?? false;
  }

  public getSnapshot(): IScopeSnapshot {
    return this.snapshot;
  }

  // ── Mutations ─────────────────────────────────────────────────────────

  public async setScope(nodeId: string): Promise<void> {
    this.loading = true;
    this.emit();
    try {
      const next = this.resolveFn?.(nodeId) ?? null;
      if (next) {
        this.scope = next;
        this.originalScope = null;
      }
    } finally {
      this.loading = false;
      this.emit();
    }
  }

  public async emulate(nodeId: string): Promise<void> {
    if (this.scope && !this.scope.emulated) {
      this.originalScope = this.scope;
    }
    this.loading = true;
    this.emit();
    try {
      const next = this.resolveFn?.(nodeId) ?? null;
      if (next) this.scope = { ...next, emulated: true };
    } finally {
      this.loading = false;
      this.emit();
    }
  }

  public restore(): void {
    if (this.originalScope) {
      this.scope = this.originalScope;
      this.originalScope = null;
      this.emit();
    }
  }

  public async resolveValue<T = unknown>(namespace: string, key: string): Promise<T | null> {
    if (!this.valueResolver || !this.scope?.nodeId) return null;
    const value = this.valueResolver(this.scope.nodeId, namespace, key);
    return (value as T) ?? null;
  }

  // ── Subscription ──────────────────────────────────────────────────────

  public subscribe(listener: ScopeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // ── Test hooks ────────────────────────────────────────────────────────

  /** Force the active scope directly and notify subscribers. */
  public simulateScope(next: IScopeContext | null): void {
    this.scope = next;
    this.emit();
  }

  /** Force the node tree directly and notify subscribers. */
  public simulateTree(next: readonly IScopeNodeTreeNode[]): void {
    this.tree = next;
    this.emit();
  }

  /** Force the loading flag directly and notify subscribers. */
  public simulateLoading(next: boolean): void {
    this.loading = next;
    this.emit();
  }

  /** Reset all state and clear listeners. */
  public reset(): void {
    this.scope = null;
    this.tree = [];
    this.loading = false;
    this.originalScope = null;
    this.listeners.clear();
    this.snapshot = this.buildSnapshot();
  }

  // ── Private ───────────────────────────────────────────────────────────

  private buildSnapshot(): IScopeSnapshot {
    return {
      scope: this.scope,
      tree: this.tree,
      isLoading: this.loading,
      isEmulating: this.scope?.emulated ?? false,
    };
  }

  private emit(): void {
    this.snapshot = this.buildSnapshot();
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        // A subscriber error must not break the mock.
      }
    }
  }
}
