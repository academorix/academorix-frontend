/**
 * @file use-scope-tree.hook.ts
 * @module @stackra/scope/react/hooks
 * @description Access the scope tree (switchable nodes) for the current user.
 */

import { useScope } from "../use-scope";
import type { IScopeNodeTreeNode } from "@/core/interfaces";

/**
 * Access the hierarchical scope tree — the concrete nodes the current
 * user can switch to.
 *
 * @example
 * ```tsx
 * function ScopeHierarchy() {
 *   const tree = useScopeTree();
 *   return <TreeView data={tree} />;
 * }
 * ```
 */
export function useScopeTree(): readonly IScopeNodeTreeNode[] {
  return useScope().tree;
}
