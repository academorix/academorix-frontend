/**
 * @file scope-node-tree-node.interface.ts
 * @module @stackra/scope/core/interfaces
 * @description The concrete scope tree — hierarchical view of scope
 *   *instances* the current user can switch to (this venue, that team),
 *   as delivered by `IScopeDataSource.loadTree` and consumed by
 *   `<ScopeSwitcher>` / `useScopeTree()`.
 *
 *   Distinct from `IScopeDefinitionTreeNode`, which describes the
 *   *level* schema (owner → venue → team) — that shape is a design-time
 *   tree computed via `buildTree(definitions)` and is not tracked by
 *   the runtime service.
 */

/**
 * A node in the concrete scope tree.
 *
 * Each node represents a real instance in the hierarchy (the caller's
 * owner root, a specific venue, a specific team) together with the
 * display metadata the switcher needs and the opaque `id` used by
 * `ScopeService.setScope(id)` and `ScopeService.emulate(id)`.
 *
 * The tree is authorised backend-side: the data source returns only
 * the subset of nodes the current user may switch to (or emulate into).
 * A node MAY be present but flagged `disabled: true` when the user
 * should see it (context) but not select it.
 */
export interface IScopeNodeTreeNode {
  /**
   * Node id. Passed verbatim to `ScopeService.setScope(id)` /
   * `ScopeService.emulate(id)`; opaque to the client.
   */
  readonly id: string;

  /** Owning tenant/organization id. */
  readonly ownerId: string;

  /**
   * The hierarchy level slug this node belongs to (e.g. `owner`,
   * `venue`, `team`). Matches `IScopeContext.level` when this node is
   * active.
   */
  readonly level: string;

  /** The real entity id mapped to this node (e.g. a venue id). */
  readonly entityId: string;

  /**
   * Human-readable label for the switcher UI (e.g. "Downtown Venue",
   * "Team Alpha"). Backend-localised — no client-side translation.
   */
  readonly label: string;

  /**
   * Optional secondary description (a subtitle) shown beneath the
   * label in richer UIs. Backend-localised. Optional.
   */
  readonly description?: string;

  /**
   * When `true`, the node is rendered but not selectable — the switcher
   * disables the row. Use for nodes the user can see but not act on.
   * Defaults to `false` when omitted.
   */
  readonly disabled?: boolean;

  /** Child nodes in the hierarchy, ordered as returned by the backend. */
  readonly children: readonly IScopeNodeTreeNode[];
}
