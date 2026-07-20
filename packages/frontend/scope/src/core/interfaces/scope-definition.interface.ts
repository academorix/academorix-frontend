/**
 * @file scope-definition.interface.ts
 * @module @stackra/scope/core/interfaces
 * @description A hierarchy-level definition + the tree shape derived from a
 *   flat list of them. Mirrors the backend `scope_definitions` (read shape).
 */

/**
 * A hierarchy level definition (e.g. `global`, `owner`, `venue`).
 */
export interface IScopeDefinition {
  /** Unique level slug. */
  readonly slug: string;
  /** Human-readable label. */
  readonly label: string;
  /** Parent level slug, or `null` for the root level. */
  readonly parent_slug: string | null;
  /** Ordering within the parent level. */
  readonly sort_order: number;
}

/**
 * A node in the derived definition tree — the nested form of
 * {@link IScopeDefinition}, produced by `buildTree`.
 */
export interface IScopeDefinitionTreeNode {
  readonly slug: string;
  readonly label: string;
  readonly sort_order: number;
  children: IScopeDefinitionTreeNode[];
}
