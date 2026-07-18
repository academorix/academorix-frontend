/**
 * @file auth-action-response.interface.ts
 * @module @stackra/contracts/interfaces/auth
 * @description Standard response shape returned by every mutating
 *   `IAuthService` operation (login, logout, register, verify, etc.).
 */

/**
 * Standard response shape for auth mutation methods.
 */
export interface IAuthActionResponse {
  /** Whether the operation completed successfully. */
  success: boolean;
  /** Optional URL the caller should navigate to on success / failure. */
  redirectTo?: string;
  /** The error that caused a failure. Absent on success. */
  error?: Error;
}
