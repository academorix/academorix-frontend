/**
 * @file mock-scope-data-source.ts
 * @module @stackra/scope/testing
 * @description In-memory `IScopeDataSource` implementation for tests.
 *
 *   Serves pre-seeded scope contexts + node tree without a backend.
 *   Records every `resolveScope` / `loadTree` / `resolveValue` / `persist`
 *   call on `.calls` for assertions.
 */

import type { IScopeContext, IScopeDataSource, IScopeNodeTreeNode } from "../core/interfaces";

/** A recorded data-source call. */
export type RecordedDataSourceCall =
  | { kind: "resolveScope"; nodeId: string }
  | { kind: "loadTree" }
  | { kind: "resolveValue"; nodeId: string; namespace: string; key: string }
  | { kind: "persist"; scope: IScopeContext };

/**
 * In-memory scope data source for testing.
 *
 * Prefer this over a hand-rolled `IScopeDataSource` when you want to
 * assert on how the client called your backend — the mock records the
 * arguments to every hit.
 *
 * @example
 * ```ts
 * const source = new MockScopeDataSource({
 *   scopes: {
 *     'node-venue-1': {
 *       ownerId: 'owner-1',
 *       nodeId: 'node-venue-1',
 *       level: 'venue',
 *       entityId: 'venue-1',
 *       path: ['node-venue-1'],
 *       ancestors: { venue: 'venue-1' },
 *     },
 *   },
 * });
 * expect((await source.resolveScope('node-venue-1'))?.entityId).toBe('venue-1');
 * expect(source.calls.some((c) => c.kind === 'resolveScope')).toBe(true);
 * ```
 */
export class MockScopeDataSource implements IScopeDataSource {
  /** Recorded call log. */
  public readonly calls: RecordedDataSourceCall[] = [];

  private readonly scopes: Map<string, IScopeContext>;
  private readonly tree: readonly IScopeNodeTreeNode[];
  private readonly values: Map<string, unknown>;
  private readonly persisted: IScopeContext[] = [];

  public constructor(seed?: {
    /** Map of node id → context returned by `resolveScope(nodeId)`. */
    scopes?: Record<string, IScopeContext>;
    /** Node tree returned by `loadTree`. */
    tree?: readonly IScopeNodeTreeNode[];
    /**
     * Pre-seeded cascading values, keyed by `${nodeId}:${namespace}:${key}`.
     */
    values?: Record<string, unknown>;
  }) {
    this.scopes = new Map(Object.entries(seed?.scopes ?? {}));
    this.tree = seed?.tree ?? [];
    this.values = new Map(Object.entries(seed?.values ?? {}));
  }

  public async resolveScope(nodeId: string): Promise<IScopeContext | null> {
    this.calls.push({ kind: "resolveScope", nodeId });
    return this.scopes.get(nodeId) ?? null;
  }

  public async loadTree(): Promise<IScopeNodeTreeNode[]> {
    this.calls.push({ kind: "loadTree" });
    return [...this.tree];
  }

  public async resolveValue<T = unknown>(
    nodeId: string,
    namespace: string,
    key: string,
  ): Promise<T | null> {
    this.calls.push({ kind: "resolveValue", nodeId, namespace, key });
    const compositeKey = `${nodeId}:${namespace}:${key}`;
    return (this.values.get(compositeKey) as T) ?? null;
  }

  public persist(scope: IScopeContext): void {
    this.calls.push({ kind: "persist", scope });
    this.persisted.push(scope);
  }

  // ── Test hooks ────────────────────────────────────────────────────────

  /** Every scope handed to `persist`, in order. */
  public getPersisted(): readonly IScopeContext[] {
    return this.persisted;
  }

  /** Add / replace a resolvable scope context. */
  public seedScope(nodeId: string, ctx: IScopeContext): void {
    this.scopes.set(nodeId, ctx);
  }

  /** Add / replace a resolvable value under `${nodeId}:${namespace}:${key}`. */
  public seedValue(nodeId: string, namespace: string, key: string, value: unknown): void {
    this.values.set(`${nodeId}:${namespace}:${key}`, value);
  }

  /** Reset call log + persisted history (keeps seeded scopes/values). */
  public resetCalls(): void {
    this.calls.length = 0;
    this.persisted.length = 0;
  }
}
