/**
 * @file can-response.interface.ts
 * @module @stackra/contracts/interfaces/auth
 * @description Response shape returned by
 *   `IAccessControlService.can(...)`.
 */

/**
 * Result of an authorisation check.
 *
 * Returned by {@link IAccessControlService.can}. `can === true` means
 * the caller may proceed. `reason` is a human-readable explanation for
 * a denial, safe to surface in UI copy or logs.
 */
export interface ICanResponse {
  /** Whether the requested action is allowed. */
  can: boolean;
  /** Human-readable reason for a denial. Absent on allow. */
  reason?: string;
}
