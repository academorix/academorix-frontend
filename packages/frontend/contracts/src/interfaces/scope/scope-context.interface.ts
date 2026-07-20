/**
 * @file scope-context.interface.ts
 * @module @stackra/contracts/interfaces/scope
 * @description Immutable value object representing the active execution
 *   scope — the single integration point for all data isolation.
 */

/**
 * Immutable value object representing the current execution scope.
 *
 * The single integration point for all data isolation across the system.
 * It carries the full hierarchy position, not just one level. Resolved
 * once per request via the scope resolver chain and stored in
 * `AsyncLocalStorage` (backend) or React Context (frontend).
 *
 * @example
 * ```typescript
 * // A venue-level scope context:
 * const ctx: IScopeContext = {
 *   ownerId: 'org-uuid-123',
 *   nodeId: 'venue-node-uuid-456',
 *   level: 'venue',
 *   entityId: 'venue-uuid-789',
 *   path: ['venue-node-uuid-456', 'region-node-uuid-321', 'org-root-node-uuid-111'],
 *   ancestors: { venue: 'venue-uuid-789', region: 'region-uuid-321', organization: 'org-uuid-123' },
 *   emulated: false,
 * };
 * ```
 */
export interface IScopeContext {
  /** The root owner id (the root isolation boundary). */
  ownerId: string;

  /** The current scope node id (most specific level). */
  nodeId: string;

  /** The scope level slug (e.g. `'venue'`, `'region'`, `'global'`). */
  level: string;

  /** The entity id at the current level (e.g. the venue UUID). */
  entityId: string;

  /** Full ancestor chain from current → root (node ids). */
  path: readonly string[];

  /** All ancestor entity ids grouped by level slug for quick lookup. */
  ancestors: Readonly<Record<string, string>>;

  /** Whether this context is emulated (not the user's real scope). */
  emulated: boolean;
}
