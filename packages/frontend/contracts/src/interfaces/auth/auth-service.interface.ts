/**
 * @file auth-service.interface.ts
 * @module @stackra/contracts/interfaces/auth
 * @description The authentication service contract.
 *
 *   Implemented by `@stackra/auth`'s default `AuthService` and any
 *   caller-supplied override bound to {@link AUTH_SERVICE}. Guards and
 *   feature modules inject the token and depend only on this shape.
 */

import type { IAuthActionResponse } from "./auth-action-response.interface";
import type { IAuthCheckResponse } from "./auth-check-response.interface";

/**
 * The authentication service contract.
 */
export interface IAuthService {
  /** Attempt a login with the provided credentials. */
  login(params: unknown): Promise<IAuthActionResponse>;

  /** Terminate the current session, both server-side and locally. */
  logout(params?: unknown): Promise<IAuthActionResponse>;

  /** Register a new user. */
  register(params: unknown): Promise<IAuthActionResponse>;

  /**
   * Kick off a multi-factor challenge (`totp`, `sms`, `email`, …).
   *
   * @returns Provider-specific payload — the caller uses it to render
   *   the corresponding challenge UI.
   */
  challenge(provider: string, input?: Record<string, unknown>): Promise<unknown>;

  /** Verify a multi-factor challenge response. */
  verify(provider: string, input?: Record<string, unknown>): Promise<IAuthActionResponse>;

  /** Send a forgot-password link to the supplied email. */
  forgotPassword(email: string): Promise<IAuthActionResponse>;

  /** Complete a password reset with the emailed token. */
  resetPassword(email: string, token: string, password: string): Promise<IAuthActionResponse>;

  /** Update the authenticated user's password (current + new). */
  updatePassword(currentPassword: string, password: string): Promise<IAuthActionResponse>;

  /** Link an external identity provider to the current account. */
  link(provider: string, input?: Record<string, unknown>): Promise<IAuthActionResponse>;

  /** Unlink an external identity provider from the current account. */
  unlink(provider: string): Promise<IAuthActionResponse>;

  /** Lightweight authentication check — used by guards + interceptors. */
  check(): Promise<IAuthCheckResponse>;

  /** Return the cached / server-loaded user identity. */
  getIdentity(): Promise<unknown>;

  /** Return the full session payload (user + token + permissions + roles). */
  getSession(): Promise<unknown>;

  /** Return the current user's permission set. */
  getPermissions(): Promise<unknown>;

  /**
   * Called by HTTP interceptors on API failure to decide whether the
   * caller should be logged out or redirected.
   */
  onError(error: unknown): Promise<{ logout?: boolean; redirectTo?: string }>;

  // ── WebAuthn / Passkey (optional — implement when supported). ──────
  /** Return the WebAuthn registration options payload from the server. */
  getPasskeyRegistrationOptions?(): Promise<unknown | null>;
  /** Register a WebAuthn credential produced by the browser. */
  registerPasskey?(credential: Record<string, unknown>): Promise<IAuthActionResponse>;
  /** Return the WebAuthn authentication options payload from the server. */
  getPasskeyAuthenticationOptions?(): Promise<unknown | null>;
  /** Authenticate using a WebAuthn assertion produced by the browser. */
  authenticatePasskey?(assertion: Record<string, unknown>): Promise<IAuthActionResponse>;
}
