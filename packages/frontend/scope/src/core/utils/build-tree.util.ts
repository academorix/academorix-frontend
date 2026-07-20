/**
 * @file build-tree.util.ts
 * @module @stackra/scope/utils
 * @description Utility for building a hierarchical tree structure from
 *   a flat list of scope definitions.
 */

import type { IScopeDefinition, IScopeDefinitionTreeNode } from "../interfaces";

// ════════════════════════════════════════════════════════════════════════════════
// Utility
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Build a nested tree from a flat list of scope definitions.
 *
 * Groups definitions by parent_slug and recursively builds children arrays.
 * Root definitions (parent_slug = null) become top-level nodes. Children are
 * sorted by sort_order ascending at each level.
 *
 * @param definitions - Flat list of scope definitions (typically from DB)
 * @returns Hierarchical tree structure
 *
 * @example
 * ```typescript
 * const flat = [
 *   { slug: 'global', label: 'Global', parent_slug: null, sort_order: 0 },
 *   { slug: 'owner', label: 'Owner', parent_slug: 'global', sort_order: 1 },
 *   { slug: 'venue', label: 'Venue', parent_slug: 'owner', sort_order: 2 },
 * ];
 *
 * buildTree(flat);
 * // Returns:
 * // [{ slug: 'global', label: 'Global', sort_order: 0, children: [
 * //   { slug: 'owner', label: 'Owner', sort_order: 1, children: [
 * //     { slug: 'venue', label: 'Venue', sort_order: 2, children: [] }
 * //   ]}
 * // ]}]
 * ```
 */
export function buildTree(definitions: IScopeDefinition[]): IScopeDefinitionTreeNode[] {
  // Group by parent_slug
  const childrenMap = new Map<string | null, IScopeDefinitionTreeNode[]>();

  for (const def of definitions) {
    const parentKey = def.parent_slug ?? null;

    if (!childrenMap.has(parentKey)) {
      childrenMap.set(parentKey, []);
    }

    childrenMap.get(parentKey)!.push({
      slug: def.slug,
      label: def.label,
      sort_order: def.sort_order,
      children: [],
    });
  }

  // Recursively attach children
  const attachChildren = (nodes: IScopeDefinitionTreeNode[]): IScopeDefinitionTreeNode[] => {
    for (const node of nodes) {
      const children = childrenMap.get(node.slug) ?? [];
      node.children = attachChildren(children.sort((a, b) => a.sort_order - b.sort_order));
    }

    return nodes;
  };

  // Start from root (null parent)
  const roots = childrenMap.get(null) ?? [];

  return attachChildren(roots.sort((a, b) => a.sort_order - b.sort_order));
}
