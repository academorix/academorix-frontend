/**
 * @file scope-cache.interface.ts
 * @module @stackra/contracts/interfaces/scope
 * @description Public contract for the scope caching layer.
 */

import type { IScopeDefinitionTreeNode } from "./scope-definition-tree-node.interface";

/**
 * Scope cache contract.
 *
 * Caches resolved values, ancestor chains, and definition trees for
 * sub-millisecond hot-path resolution. Implementations use Redis when
 * available, falling back to an in-memory LRU cache.
 */
export interface IScopeCache {
  /**
   * Get a cached resolved value.
   */
  getResolved(
    ownerId: string,
    nodeId: string,
    namespace: string,
    key: string,
  ): Promise<unknown | undefined>;

  /**
   * Cache a resolved value.
   */
  setResolved(
    ownerId: string,
    nodeId: string,
    namespace: string,
    key: string,
    value: unknown,
    ttl: number,
  ): Promise<void>;

  /**
   * Get cached ancestor node ids for a node.
   */
  getAncestors(nodeId: string): Promise<readonly string[] | undefined>;

  /**
   * Cache ancestor node ids.
   */
  setAncestors(nodeId: string, ancestors: readonly string[], ttl: number): Promise<void>;

  /**
   * Get the cached scope definition tree.
   */
  getTree(ownerId: string): Promise<readonly IScopeDefinitionTreeNode[] | undefined>;

  /**
   * Cache the scope definition tree.
   */
  setTree(ownerId: string, tree: readonly IScopeDefinitionTreeNode[], ttl: number): Promise<void>;

  /**
   * Invalidate resolved-value caches for a namespace/key across
   * descendant nodes.
   */
  invalidateResolved(
    ownerId: string,
    namespace: string,
    key: string,
    descendantNodeIds: readonly string[],
  ): Promise<void>;

  /**
   * Invalidate ancestor-path caches for the supplied nodes.
   */
  invalidateAncestors(nodeIds: readonly string[]): Promise<void>;

  /**
   * Invalidate the definition-tree cache for a tenant.
   */
  invalidateTree(ownerId: string): Promise<void>;

  /**
   * Clear every scope cache entry for a tenant.
   */
  flush(ownerId: string): Promise<void>;

  /**
   * Pre-populate the cache with ancestor chains and the definition tree.
   */
  warmup(
    ownerId: string,
    data?: {
      ancestors?: Map<string, readonly string[]>;
      tree?: readonly IScopeDefinitionTreeNode[];
    },
  ): Promise<void>;
}
