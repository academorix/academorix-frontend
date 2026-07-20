/**
 * @file parse-materialized-path.util.ts
 * @module @stackra/scope/utils
 * @description Utility for parsing materialized path strings into ordered node ID arrays.
 *   Provides O(1) ancestor chain retrieval by string splitting instead of
 *   recursive database queries.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Utility
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Parse a materialized path into an ordered array of node IDs.
 *
 * The path format is `/nodeId1/nodeId2/.../nodeIdN` where nodeId1 is the
 * root and nodeIdN is the most specific (current) node.
 *
 * Returns the IDs in **reverse order** (most specific first → root last)
 * for efficient cascading resolution (start at self, walk up to root).
 *
 * @param path - Materialized path string (e.g., "/root-id/parent-id/self-id")
 * @returns Ordered node IDs from most specific (self) to root
 *
 * @example
 * ```typescript
 * parseMaterializedPath('/aaa/bbb/ccc');
 * // Returns: ['ccc', 'bbb', 'aaa'] (self → root)
 *
 * parseMaterializedPath('/single');
 * // Returns: ['single']
 *
 * parseMaterializedPath('');
 * // Returns: []
 * ```
 */
export function parseMaterializedPath(path: string): string[] {
  if (!path) return [];

  const segments = path.split('/').filter(Boolean);

  // Reverse: materialized path is root→self, but resolution needs self→root
  return segments.reverse();
}
