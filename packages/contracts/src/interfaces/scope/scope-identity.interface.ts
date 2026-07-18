/**
 * @file scope-identity.interface.ts
 * @module @stackra/contracts/interfaces/scope
 * @description Minimal scope identity for targeting a specific scope node.
 */

/**
 * Minimal scope identity for targeting a specific scope node.
 *
 * Used by the {@link IScopeEmulator} to identify the target scope
 * without requiring a full {@link IScopeContext} — the emulator
 * resolves the rest.
 */
export interface IScopeIdentity {
  /** Owner id (tenant/organization). */
  ownerId: string;

  /** Scope level slug (e.g. `'venue'`, `'region'`). */
  level: string;

  /** Entity id at the target level (e.g. venue UUID). */
  entityId: string;
}
