/**
 * @file auth.events.ts
 * @module @stackra/contracts/events
 * @description Event names emitted by `@stackra/auth` on the
 *   `EVENT_EMITTER` bus.
 *
 *   Constants live in contracts so cross-package consumers (analytics,
 *   audit trails, security dashboards) can subscribe without depending
 *   on the auth runtime.
 */

/**
 * Auth lifecycle event names.
 */
export const AuthEvents = {
  // ── Login ─────────────────────────────────────────────────────────
  /** A login attempt has begun. Payload: `{ params: unknown }`. */
  LOGIN_ATTEMPT: "auth.login.attempt",
  /** A login attempt succeeded. Payload: `{ user, token }`. */
  LOGIN_SUCCEEDED: "auth.login.succeeded",
  /** Convenience alias of {@link LOGIN_SUCCEEDED} used by passkey / SSO flows. */
  LOGIN_SUCCESS: "auth.login.succeeded",
  /** A login attempt failed. Payload: `{ error, params }`. */
  LOGIN_FAILED: "auth.login.failed",

  // ── Logout ─────────────────────────────────────────────────────────
  /** A logout attempt has begun. Payload: `{}`. */
  LOGOUT_ATTEMPT: "auth.logout.attempt",
  /** Logout finished (server + local state cleared). Payload: `{}`. */
  LOGOUT_COMPLETED: "auth.logout.completed",

  // ── Registration ───────────────────────────────────────────────────
  /** A user registration succeeded. Payload: `{ user }`. */
  REGISTRATION_COMPLETED: "auth.registration.completed",

  // ── MFA / Verify ───────────────────────────────────────────────────
  /** An MFA / OTP verification succeeded. Payload: `{ provider }`. */
  VERIFICATION_COMPLETED: "auth.verification.completed",
  /** An MFA / OTP verification failed. Payload: `{ provider, error }`. */
  VERIFICATION_FAILED: "auth.verification.failed",

  // ── Password ───────────────────────────────────────────────────────
  /** A password was reset or updated. Payload: `{}`. */
  PASSWORD_CHANGED: "auth.password.changed",

  // ── Identity provider linking ──────────────────────────────────────
  /** An identity provider was linked to the account. Payload: `{ provider }`. */
  IDENTITY_LINKED: "auth.identity.linked",
  /** Linking an identity provider failed. Payload: `{ provider, error }`. */
  IDENTITY_LINKING_FAILED: "auth.identity.linking.failed",
  /** An identity provider was unlinked from the account. Payload: `{ provider }`. */
  IDENTITY_UNLINKED: "auth.identity.unlinked",

  // ── Session ────────────────────────────────────────────────────────
  /** The stored token has expired or been rejected. Payload: `{}`. */
  TOKEN_EXPIRED: "auth.token.expired",
  /** A session was destroyed (specific id or all). Payload: `{ sessionId?, all? }`. */
  SESSION_DESTROYED: "auth.session.destroyed",

  // ── Identity / permissions ─────────────────────────────────────────
  /** The identity payload was loaded from the server. Payload: `{ identity }`. */
  IDENTITY_LOADED: "auth.identity.loaded",
  /** The permissions list was loaded from the server. Payload: `{ permissions }`. */
  PERMISSIONS_LOADED: "auth.permissions.loaded",

  // ── Security ───────────────────────────────────────────────────────
  /** Server reported the account is locked. Payload: `{ reason, retryAfter }`. */
  ACCOUNT_LOCKED: "auth.account.locked",
  /** A specific device was revoked. Payload: `{ fingerprint }`. */
  DEVICE_REVOKED: "auth.device.revoked",

  // ── Passkey / WebAuthn ─────────────────────────────────────────────
  /** A WebAuthn credential was registered. Payload: `{ credentialId }`. */
  PASSKEY_REGISTERED: "auth.passkey.registered",
} as const;

/** Union type of every emitted auth event name. */
export type AuthEvent = (typeof AuthEvents)[keyof typeof AuthEvents];
