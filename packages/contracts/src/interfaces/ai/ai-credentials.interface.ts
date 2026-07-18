/**
 * @file ai-credentials.interface.ts
 * @module @stackra/contracts/interfaces/ai
 * @description Credentials attached to backend AI requests and transport
 *   connections.
 */

/**
 * Credentials yielded by an {@link IAiAuthProvider}.
 *
 * Typically a bearer token plus tenant/user/role headers. Never written to
 * conversation or context state.
 */
export interface IAiCredentials {
  /** Bearer token attached as `Authorization: Bearer <token>`. */
  token?: string;
  /** Arbitrary additional headers (tenant/user/role, etc.). */
  headers?: Record<string, string>;
}
