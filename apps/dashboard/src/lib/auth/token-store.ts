/**
 * @file token-store.ts
 * @module lib/auth/token-store
 *
 * @description
 * `localStorage`-backed persistence for the Sanctum bearer token.
 *
 * ## Why localStorage over cookies
 *
 * The backend uses Sanctum in **PAT (bearer token) mode** — `POST /api/auth/login`
 * returns an `access_token` in the body, and every subsequent authenticated
 * request must carry `Authorization: Bearer {token}`. That contract works
 * cleanly with client-side storage; cookies would require a separate CSRF
 * bootstrap round-trip and force us to run the SPA on the same origin as
 * the API host, which we don't want (marketing site + admin console + tenant
 * dashboards are all distinct origins).
 *
 * ## Why we track expiry explicitly
 *
 * Sanctum tokens don't self-expire on the client — they're valid until
 * revoked server-side or until they hit the `sanctum.expiration` TTL. The
 * server sends the expiry in the `expires_at` field of the login response;
 * we store it alongside the token so the check-auth path can bail early
 * on stale tokens without paying a round trip to discover a 401.
 *
 * ## Storage keys
 *
 * All keys are namespaced with `academorix.auth.*` so a devtools tinker on
 * one entry can't accidentally corrupt an adjacent one (branch selection,
 * theme, layout preferences).
 */

/** Key holding the raw bearer token. */
const TOKEN_KEY = "academorix.auth.token";

/** Key holding the ISO-8601 expiry timestamp, if the server provided one. */
const TOKEN_EXPIRES_AT_KEY = "academorix.auth.token-expires-at";

/**
 * Key holding a JSON-encoded copy of the returned user payload so the
 * dashboard can render the shell without a `GET /api/auth/me` round trip
 * on cold starts. Refreshed on every successful login and cleared on
 * logout so a stale profile can't leak into a new session.
 */
const CACHED_USER_KEY = "academorix.auth.cached-user";

/** Shape of the persisted auth state — mirrors `AuthTokenData` from the API. */
export interface AuthTokenState {
  /** The raw bearer token string. */
  accessToken: string;
  /**
   * ISO-8601 timestamp at which the server will start rejecting this
   * token. May be `null` when the tenant runs Sanctum with an infinite
   * TTL (`sanctum.expiration = null`).
   */
  expiresAt: string | null;
}

/**
 * Safely read a raw string from `localStorage`.
 *
 * Wrapped so callers don't have to handle `SecurityError` /
 * `QuotaExceededError` cases individually — some browsers (Safari in
 * "Prevent cross-site tracking" mode, private browsing) synchronously
 * throw when storage is unavailable.
 */
function safeGet(key: string): string | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Safely write a string to `localStorage`. Silent on failure so an
 * unavailable-storage browser degrades to a session-only login.
 */
function safeSet(key: string, value: string): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // no-op — storage errors turn the token into a memory-only value
    // for the rest of the tab's lifetime, which is acceptable.
  }
}

/** Safely remove a key from `localStorage`. */
function safeRemove(key: string): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(key);
  } catch {
    // no-op — same as safeSet.
  }
}

/**
 * Read the current auth state, or `null` when the user hasn't logged
 * in or the token has expired. Expiry is checked eagerly here so
 * callers never see a stale value.
 */
export function readAuthToken(): AuthTokenState | null {
  const accessToken = safeGet(TOKEN_KEY);

  if (!accessToken) return null;

  const expiresAt = safeGet(TOKEN_EXPIRES_AT_KEY);

  if (expiresAt) {
    // A malformed expiry string (edited by hand, corrupted store)
    // parses to `NaN`; `Date.parse` returns `NaN` too. Treat that as
    // "unknown" rather than throwing so the caller can proceed and
    // let a real 401 tear the session down.
    const expiresMs = Date.parse(expiresAt);

    if (Number.isFinite(expiresMs) && expiresMs <= Date.now()) {
      clearAuthToken();

      return null;
    }
  }

  return { accessToken, expiresAt };
}

/**
 * Convenience — returns just the bearer string, or `null`. Used by the
 * HTTP client so it doesn't have to unwrap the envelope on every fetch.
 */
export function readAccessToken(): string | null {
  return readAuthToken()?.accessToken ?? null;
}

/** Persist a new auth state. Overwrites any prior token. */
export function writeAuthToken(state: AuthTokenState): void {
  safeSet(TOKEN_KEY, state.accessToken);

  if (state.expiresAt) {
    safeSet(TOKEN_EXPIRES_AT_KEY, state.expiresAt);
  } else {
    safeRemove(TOKEN_EXPIRES_AT_KEY);
  }
}

/**
 * Persist the last-known user payload so the shell can render on cold
 * start without waiting for `GET /api/auth/me`. Kept opaque — the
 * caller owns the shape (typed as {@link Identity} at the read site).
 */
export function writeCachedUser<T>(user: T): void {
  try {
    safeSet(CACHED_USER_KEY, JSON.stringify(user));
  } catch {
    // no-op — JSON.stringify only throws on circular refs, which the
    // identity envelope never carries.
  }
}

/**
 * Read the last-known user payload, or `null` when the cache is empty
 * or unparseable. Returns `null` (not undefined) so callers can
 * consistently branch on falsy.
 */
export function readCachedUser<T>(): T | null {
  const raw = safeGet(CACHED_USER_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Wipe every auth-related key. Called on `logout()`, on 401 responses
 * from the API, and by the sign-in page on mount so a lingering token
 * from a previous session can't leak into a fresh sign-in attempt.
 */
export function clearAuthToken(): void {
  safeRemove(TOKEN_KEY);
  safeRemove(TOKEN_EXPIRES_AT_KEY);
  safeRemove(CACHED_USER_KEY);
}
