/**
 * @file scope-value.interface.ts
 * @module @stackra/contracts/interfaces/scope
 * @description A key-value pair stored at a scope node, namespaced by
 *   consumer package.
 */

/**
 * Scope value — a key-value pair stored at a scope node.
 *
 * Values are namespaced by consumer package (e.g. `'settings'`,
 * `'permissions'`) to prevent key collisions. The `value` field is
 * JSONB — any serializable type.
 */
export interface IScopeValue {
  /** Unique identifier. */
  id: string;

  /** The scope node this value is stored at. */
  scope_node_id: string;

  /** Consumer namespace that owns this value (e.g. `'settings'`). */
  namespace: string;

  /** Configuration key within the namespace. */
  key: string;

  /** The stored value (JSONB — any serializable type). */
  value: unknown;

  /** Creation timestamp. */
  created_at: Date;

  /** Last update timestamp. */
  updated_at: Date;
}
