/**
 * @file token-store.ts
 * @module @academorix/http/tokens/token-store
 *
 * @description
 * Framework-agnostic, observable holder for a bearer token + its expiry.
 *
 * ## Security model
 *
 * The token lives primarily in memory (a class field on the singleton).
 * In-memory storage is not directly readable by injected scripts the way
 * `localStorage` is, which shrinks the XSS blast radius.
 *
 * To survive full-page reloads during development (and because a
 * cookie-based refresh flow is not always available), the token is
 * *also* mirrored into a Web Storage area — `sessionStorage` by
 * default, so it clears when the tab closes. This is a deliberate,
 * documented trade-off:
 *
 * > **Production hardening**: once the backend exposes a refresh
 * > endpoint backed by an httpOnly, SameSite cookie, disable
 * > persistence (`persist: false`) and rehydrate the in-memory token
 * > from `/auth/refresh` on boot instead. That removes the token from
 * > JS-readable storage entirely.
 *
 * ## Reactivity
 *
 * The store is observable: the HTTP client and auth provider
 * `subscribe()` so that a `401 → clearToken()` anywhere instantly
 * propagates (e.g. to redirect the user to `/login`). Intentionally
 * framework-agnostic — no React — so it works from plain modules,
 * Server Components, and tests.
 */

/** Listener invoked whenever the token value changes. */
export type TokenListener = (token: string | null) => void;

/** Options controlling how the store persists the token across reloads. */
export interface TokenStoreOptions {
  /** Storage key used for the mirrored token. */
  readonly storageKey?: string;
  /** Storage key used for the mirrored expiry timestamp. */
  readonly expiryStorageKey?: string;
  /**
   * Whether to mirror the token to Web Storage. Defaults to `true` in
   * the browser. Set `false` in production once a refresh-cookie flow
   * exists.
   */
  readonly persist?: boolean;
  /**
   * Factory returning the Web Storage area to persist into. Defaults to
   * `sessionStorage`. Swap for `localStorage` to persist across tab
   * restarts (weaker security), or a no-op store in non-browser
   * environments.
   */
  readonly getStorage?: () => Storage | undefined;
}

const DEFAULT_STORAGE_KEY = "academorix.auth.token";
const DEFAULT_EXPIRY_KEY = "academorix.auth.token_expires_at";

/**
 * Safely resolves the default persistence area (`sessionStorage`),
 * returning `undefined` when Web Storage is unavailable (SSR, privacy
 * mode, tests).
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
 * Observable, framework-agnostic holder for the bearer token and its
 * expiry. Each app instantiates one at boot (the singleton) and passes
 * it to `createHttpClient({ tokens })`.
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
   * Expired tokens are proactively cleared so callers never send a
   * stale one.
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
   * Whether the stored token is past its expiry. Returns `false` when
   * there is no token or no known expiry (treated as non-expiring).
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
