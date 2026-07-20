/**
 * @file scope-definition-tree-node.interface.ts
 * @module @stackra/contracts/interfaces/scope
 * @description Nested tree node for the scope definition hierarchy.
 */

/**
 * Nested tree node for the scope definition hierarchy.
 */
export interface IScopeDefinitionTreeNode {
  /** Definition slug. */
  slug: string;

  /** Display label. */
  label: string;

  /** Sort order. */
  sort_order: number;

  /** Child definitions. */
  children: readonly IScopeDefinitionTreeNode[];
}
