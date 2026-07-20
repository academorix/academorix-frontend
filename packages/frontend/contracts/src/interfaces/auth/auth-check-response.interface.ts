/**
 * @file auth-check-response.interface.ts
 * @module @stackra/contracts/interfaces/auth
 * @description Response shape returned by `IAuthService.check()`.
 */

/**
 * Result of a lightweight authentication check.
 *
 * Guards call `IAuthService.check()` and switch on `authenticated` to
 * either forward the request or throw a `redirect(...)` to `redirectTo`.
 */
export interface IAuthCheckResponse {
  /** Whether the caller is currently authenticated. */
  authenticated: boolean;
  /** Where the caller should be redirected when not authenticated. */
  redirectTo?: string;
  /** Whether the caller should be logged out entirely (e.g. token expired). */
  logout?: boolean;
  /** Optional error details when the check itself failed. */
  error?: Error;
}
