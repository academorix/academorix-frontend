/**
 * @file token-store.ts
 * @module lib/http/token-store
 *
 * @description
 * Single source of truth for the authenticated bearer token.
 *
 * ## Security model
 * The token lives primarily **in memory** (a module-scoped field on the
 * singleton). In-memory storage is not directly readable by injected scripts
 * the way `localStorage` is, which shrinks the XSS blast radius.
 *
 * To survive full-page reloads during development (and because we do not yet
 * have an httpOnly refresh-cookie endpoint), the token is *also* mirrored into
 * a Web Storage area — `sessionStorage` by default, so it is cleared when the
 * tab closes. This is a deliberate, documented trade-off:
 *
 * > **Production hardening:** once the backend exposes a refresh endpoint
 * > backed by an httpOnly, SameSite cookie, disable persistence
 * > (`persist: false`) and rehydrate the in-memory token from `/auth/refresh`
 * > on boot instead. That removes the token from JS-readable storage entirely.
 *
 * ## Reactivity
 * The store is observable: the HTTP client and auth provider `subscribe()` so
 * that a `401 → clearToken()` anywhere instantly propagates (e.g. to redirect
 * the user to `/login`). It is intentionally framework-agnostic — no React —
 * so it can be used from plain modules and tests.
 */

/** Listener invoked whenever the token value changes. */
export type TokenListener = (token: string | null) => void;

/** Options controlling how the store persists the token across reloads. */
export interface TokenStoreOptions {
  /** Storage key used for the mirrored token. */
  storageKey?: string;
  /** Storage key used for the mirrored expiry timestamp. */
  expiryStorageKey?: string;
  /**
   * Whether to mirror the token to Web Storage. Defaults to `true` in the
   * browser. Set `false` in production once a refresh-cookie flow exists.
   */
  persist?: boolean;
  /**
   * Factory returning the Web Storage area to persist into. Defaults to
   * `sessionStorage`. Swap for `localStorage` to persist across tab restarts
   * (weaker security), or a no-op store in non-browser environments.
   */
  getStorage?: () => Storage | undefined;
}

const DEFAULT_STORAGE_KEY = "academorix.auth.token";
const DEFAULT_EXPIRY_KEY = "academorix.auth.token_expires_at";

/**
 * Safely resolves the default persistence area (`sessionStorage`), returning
 * `undefined` when Web Storage is unavailable (SSR, privacy mode, tests).
 */
function defaultStorage(): Storage | undefined {
  try {
    if (typeof window === "undefined" || !window.sessionStorage) {
      return undefined;
    }

    return window.sessionStorage;
  } catch {
    // Accessing storage can throw in sandboxed iframes / strict privacy modes.
    return undefined;
  }
}

/**
 * Observable, framework-agnostic holder for the bearer token and its expiry.
 * Prefer the shared {@link tokenStore} singleton; the class is exported mainly
 * to allow isolated instances in unit tests.
 */
export class TokenStore {
  private token: string | null = null;
  private expiresAt: number | null = null;
  private readonly listeners = new Set<TokenListener>();

  private readonly storageKey: string;
  private readonly expiryStorageKey: string;
  private readonly persist: boolean;
  private readonly getStorage: () => Storage | undefined;

  constructor(options: TokenStoreOptions = {}) {
    this.storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;
    this.expiryStorageKey = options.expiryStorageKey ?? DEFAULT_EXPIRY_KEY;
    this.persist = options.persist ?? true;
    this.getStorage = options.getStorage ?? defaultStorage;

    this.hydrateFromStorage();
  }

  /**
   * Returns the current token, or `null` when signed out or expired.
   * Expired tokens are proactively cleared so callers never send a stale one.
   */
  getToken(): string | null {
    if (this.token && this.isExpired()) {
      this.clearToken();

      return null;
    }

    return this.token;
  }

  /**
   * Stores a new token and notifies subscribers.
   *
   * @param token - The plain-text bearer token.
   * @param expiresAt - Optional ISO-8601 expiry; `null`/omitted = non-expiring.
   */
  setToken(token: string, expiresAt?: string | null): void {
    this.token = token;
    this.expiresAt = expiresAt ? new Date(expiresAt).getTime() : null;
    this.writeToStorage();
    this.emit();
  }

  /** Clears the token (sign-out / 401) and notifies subscribers. */
  clearToken(): void {
    if (this.token === null && this.expiresAt === null) {
      return;
    }

    this.token = null;
    this.expiresAt = null;
    this.removeFromStorage();
    this.emit();
  }

  /** Whether a token exists and has not expired. */
  hasValidToken(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Whether the stored token is past its expiry. Returns `false` when there is
   * no token or no known expiry (treated as non-expiring).
   */
  isExpired(): boolean {
    if (this.expiresAt === null) {
      return false;
    }

    return Date.now() >= this.expiresAt;
  }

  /**
   * Subscribes to token changes.
   *
   * @returns An unsubscribe function.
   */
  subscribe(listener: TokenListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Notifies every subscriber of the current token value. */
  private emit(): void {
    for (const listener of this.listeners) {
      listener(this.token);
    }
  }

  /** Loads any previously persisted token/expiry on construction. */
  private hydrateFromStorage(): void {
    if (!this.persist) {
      return;
    }

    const storage = this.getStorage();

    if (!storage) {
      return;
    }

    try {
      const token = storage.getItem(this.storageKey);
      const expiry = storage.getItem(this.expiryStorageKey);

      if (token) {
        this.token = token;
        this.expiresAt = expiry ? Number(expiry) : null;

        // Discard a token that was already stale before this session started.
        if (this.isExpired()) {
          this.clearToken();
        }
      }
    } catch {
      // Ignore corrupt/unavailable storage — treat as signed out.
    }
  }

  /** Mirrors the in-memory token to Web Storage when persistence is enabled. */
  private writeToStorage(): void {
    if (!this.persist) {
      return;
    }

    const storage = this.getStorage();

    if (!storage || !this.token) {
      return;
    }

    try {
      storage.setItem(this.storageKey, this.token);

      if (this.expiresAt !== null) {
        storage.setItem(this.expiryStorageKey, String(this.expiresAt));
      } else {
        storage.removeItem(this.expiryStorageKey);
      }
    } catch {
      // Persistence is best-effort; the in-memory value remains authoritative.
    }
  }

  /** Removes the mirrored token from Web Storage. */
  private removeFromStorage(): void {
    if (!this.persist) {
      return;
    }

    const storage = this.getStorage();

    if (!storage) {
      return;
    }

    try {
      storage.removeItem(this.storageKey);
      storage.removeItem(this.expiryStorageKey);
    } catch {
      // Nothing actionable if removal fails.
    }
  }
}

/**
 * Shared token store used by the HTTP client, the typed OpenAPI client, and
 * the auth provider. One instance keeps every layer in sync.
 */
export const tokenStore = new TokenStore();
