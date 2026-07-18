/**
 * @file http-token-provider.interface.ts
 * @module @stackra/contracts/interfaces/http
 * @description Optional access-token provider consumed by `AuthMiddleware`.
 */

/**
 * Supplies (and refreshes) bearer tokens for outgoing requests.
 *
 * Register an implementation under the `HTTP_TOKEN_PROVIDER` token to
 * enable automatic `Authorization` header injection and refresh-on-401.
 */
export interface ITokenProvider {
  /** Return the current access token, or `null` when unauthenticated. */
  getAccessToken(): Promise<string | null>;
  /** Refresh and return a new access token. */
  refresh(): Promise<string>;
}
