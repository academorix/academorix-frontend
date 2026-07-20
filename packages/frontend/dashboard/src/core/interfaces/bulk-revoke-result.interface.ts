/**
 * @file bulk-revoke-result.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description Result of a bulk-revoke preview or apply.
 */

/**
 * Number of tokens the bulk-revoke operation would flip (preview) or
 * did flip (apply).
 */
export interface IBulkRevokeResult {
  /** Count of tokens flipped from live to revoked. */
  readonly revoked: number;
}
