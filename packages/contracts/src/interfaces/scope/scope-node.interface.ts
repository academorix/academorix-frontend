/**
 * @file scope-node.interface.ts
 * @module @stackra/contracts/interfaces/scope
 * @description A concrete instance in the scope tree.
 */

/**
 * Scope node — a concrete instance in the scope tree.
 *
 * Maps a scope definition level to a real entity id. The
 * `materialized_path` encodes the full ancestor chain for O(1) ancestor
 * lookup without recursive queries.
 */
export interface IScopeNode {
  /** Unique identifier. */
  id: string;

  /** Tenant this node belongs to. */
  owner_id: string;

  /** Reference to a scope definition slug (e.g. `'venue'`, `'region'`). */
  scope_slug: string;

  /** The real entity id this node represents (e.g. a venue UUID). */
  entity_id: string;

  /** Parent node id in the tree (`null` for root nodes). */
  parent_node_id: string | null;

  /** Materialized path encoding the ancestor chain (e.g. `'/ROOT/T1/R1/V1'`). */
  materialized_path: string;

  /** Creation timestamp. */
  created_at: Date;

  /** Last update timestamp. */
  updated_at: Date;

  /** Soft-delete timestamp (`null` if active). */
  deleted_at: Date | null;
}
