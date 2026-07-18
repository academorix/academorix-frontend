/**
 * @file scope-node.interface.ts
 * @module @stackra/scope/core/interfaces
 * @description A concrete scope node — an instance in the hierarchy mapped to
 *   a real entity. Mirrors the backend `scope_nodes` row (client-read shape).
 */

/**
 * A concrete node in the scope hierarchy.
 */
export interface IScopeNode {
  /** Node id. */
  readonly id: string;
  /** Owning tenant/organization id. */
  readonly owner_id: string;
  /** The definition slug this node belongs to (e.g. `venue`). */
  readonly scope_slug: string;
  /** The real entity id mapped to this node. */
  readonly entity_id: string;
  /** Parent node id, or `null` for a root node. */
  readonly parent_id: string | null;
  /** Materialized path (`/root/.../self`) for O(1) ancestor traversal. */
  readonly materialized_path: string;
}
