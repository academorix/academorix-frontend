/**
 * @file token-store.test.ts
 * @module @academorix/http/tokens/token-store.test
 *
 * @description
 * Unit tests for {@link TokenStore} — the observable bearer-token
 * holder that mirrors into Web Storage. Covers constructor defaults,
 * get/set/clear semantics, expiry handling, subscriber notification,
 * and every persistence branch (default `sessionStorage`, custom
 * storage factory, hydration on construction, and graceful storage
 * failures).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TokenStore } from "../token-store";

/** Default keys the store uses when the caller supplies none. */
const DEFAULT_STORAGE_KEY = "academorix.auth.token";
const DEFAULT_EXPIRY_KEY = "academorix.auth.token_expires_at";

beforeEach(() => {
  window.sessionStorage.clear();
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("TokenStore constructor", () => {
  it("uses the default storage keys when no options are supplied", () => {
    const store = new TokenStore({ persist: true });

    store.setToken("t-1");

    expect(window.sessionStorage.getItem(DEFAULT_STORAGE_KEY)).toBe("t-1");
    expect(window.sessionStorage.getItem(DEFAULT_EXPIRY_KEY)).toBeNull();
  });

  it("honours custom storageKey and expiryStorageKey options", () => {
    const store = new TokenStore({
      storageKey: "custom.token",
      expiryStorageKey: "custom.expires_at",
    });

    const expiresAt = new Date(Date.now() + 60_000).toISOString();

    store.setToken("t-1", expiresAt);

    expect(window.sessionStorage.getItem("custom.token")).toBe("t-1");
    expect(window.sessionStorage.getItem("custom.expires_at")).toBe(
      String(new Date(expiresAt).getTime()),
    );
    expect(window.sessionStorage.getItem(DEFAULT_STORAGE_KEY)).toBeNull();
  });
});

describe("setToken and getToken", () => {
  it("stores a token and returns it verbatim on getToken", () => {
    const store = new TokenStore({ persist: false });

    store.setToken("abc.def");

    expect(store.getToken()).toBe("abc.def");
  });

  it("fires every subscriber exactly once on setToken", () => {
    const store = new TokenStore({ persist: false });
    const listener = vi.fn();

    store.subscribe(listener);
    store.setToken("t-1");

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith("t-1");
  });

  it("records the expiry when setToken is called with an ISO timestamp", () => {
    const store = new TokenStore({ persist: false });
    const expiresAt = new Date(Date.now() + 30_000).toISOString();

    store.setToken("t-1", expiresAt);

    expect(store.isExpired()).toBe(false);
  });

  it("marks the token expired once the stored expiry has passed", () => {
    const store = new TokenStore({ persist: false });
    const pastExpiry = new Date(Date.now() - 1_000).toISOString();

    store.setToken("t-1", pastExpiry);

    expect(store.isExpired()).toBe(true);
  });

  it("returns null AND clears state when getToken is called on an expired token", () => {
    const store = new TokenStore({ persist: false });
    const pastExpiry = new Date(Date.now() - 1_000).toISOString();

    store.setToken("t-1", pastExpiry);

    expect(store.getToken()).toBeNull();
    // A follow-up read shows the state was cleared, not just filtered.
    expect(store.hasValidToken()).toBe(false);
    expect(store.isExpired()).toBe(false);
  });
});

describe("clearToken", () => {
  it("clears the stored token and fires every subscriber", () => {
    const store = new TokenStore({ persist: false });
    const listener = vi.fn();

    store.setToken("t-1");
    store.subscribe(listener);
    listener.mockClear();

    store.clearToken();

    expect(store.getToken()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(null);
  });

  it("is a no-op that does NOT fire subscribers when the store is already empty", () => {
    const store = new TokenStore({ persist: false });
    const listener = vi.fn();

    store.subscribe(listener);
    store.clearToken();

    expect(listener).not.toHaveBeenCalled();
  });
});

describe("hasValidToken", () => {
  it("returns true when a token exists and has not expired", () => {
    const store = new TokenStore({ persist: false });
    const future = new Date(Date.now() + 60_000).toISOString();

    store.setToken("t-1", future);

    expect(store.hasValidToken()).toBe(true);
  });

  it("returns false once the stored token has expired", () => {
    const store = new TokenStore({ persist: false });
    const past = new Date(Date.now() - 1_000).toISOString();

    store.setToken("t-1", past);

    expect(store.hasValidToken()).toBe(false);
  });

  it("returns false when no token is stored", () => {
    const store = new TokenStore({ persist: false });

    expect(store.hasValidToken()).toBe(false);
  });
});

describe("subscribe", () => {
  it("returns an unsubscribe function that stops further notifications", () => {
    const store = new TokenStore({ persist: false });
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.setToken("t-1");
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    store.setToken("t-2");

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("fires every registered subscriber on a change", () => {
    const store = new TokenStore({ persist: false });
    const a = vi.fn();
    const b = vi.fn();

    store.subscribe(a);
    store.subscribe(b);
    store.setToken("t-1");

    expect(a).toHaveBeenCalledWith("t-1");
    expect(b).toHaveBeenCalledWith("t-1");
  });
});

describe("persistence", () => {
  it("does NOT write to storage when persist is false", () => {
    const store = new TokenStore({ persist: false });

    store.setToken("t-1");

    expect(window.sessionStorage.getItem(DEFAULT_STORAGE_KEY)).toBeNull();
  });

  it("mirrors the token into sessionStorage by default", () => {
    const store = new TokenStore();

    store.setToken("t-1");

    expect(window.sessionStorage.getItem(DEFAULT_STORAGE_KEY)).toBe("t-1");
  });

  it("rehydrates a pre-populated sessionStorage entry on construction", () => {
    window.sessionStorage.setItem(DEFAULT_STORAGE_KEY, "restored-token");

    const store = new TokenStore();

    expect(store.getToken()).toBe("restored-token");
  });

  it("discards an already-expired token found in storage during hydration", () => {
    window.sessionStorage.setItem(DEFAULT_STORAGE_KEY, "stale");
    window.sessionStorage.setItem(DEFAULT_EXPIRY_KEY, String(Date.now() - 1_000));

    const store = new TokenStore();

    expect(store.getToken()).toBeNull();
    // Storage was cleaned up so the next construction is fresh.
    expect(window.sessionStorage.getItem(DEFAULT_STORAGE_KEY)).toBeNull();
    expect(window.sessionStorage.getItem(DEFAULT_EXPIRY_KEY)).toBeNull();
  });

  it("keeps the in-memory token authoritative when storage.setItem throws", () => {
    // Fake storage that always throws on write but returns null on read so
    // hydration is silent.
    const throwingStorage: Storage = {
      length: 0,
      clear: (): void => {},
      key: (): string | null => null,
      getItem: (): string | null => null,
      setItem: (): void => {
        throw new Error("QuotaExceededError");
      },
      removeItem: (): void => {},
    };

    const store = new TokenStore({ getStorage: () => throwingStorage });

    expect(() => store.setToken("t-1")).not.toThrow();
    expect(store.getToken()).toBe("t-1");
  });

  it("constructs without side effects when getStorage returns undefined (SSR path)", () => {
    const store = new TokenStore({ getStorage: () => undefined });

    store.setToken("t-1");

    expect(store.getToken()).toBe("t-1");
    // Nothing was persisted to real sessionStorage either.
    expect(window.sessionStorage.getItem(DEFAULT_STORAGE_KEY)).toBeNull();
  });

  it("removes the mirrored expiry when a token is set without one", () => {
    const store = new TokenStore();
    const expiresAt = new Date(Date.now() + 60_000).toISOString();

    store.setToken("t-1", expiresAt);
    expect(window.sessionStorage.getItem(DEFAULT_EXPIRY_KEY)).not.toBeNull();

    store.setToken("t-2");
    expect(window.sessionStorage.getItem(DEFAULT_EXPIRY_KEY)).toBeNull();
  });

  it("removes both storage entries on clearToken", () => {
    const store = new TokenStore();
    const expiresAt = new Date(Date.now() + 60_000).toISOString();

    store.setToken("t-1", expiresAt);
    store.clearToken();

    expect(window.sessionStorage.getItem(DEFAULT_STORAGE_KEY)).toBeNull();
    expect(window.sessionStorage.getItem(DEFAULT_EXPIRY_KEY)).toBeNull();
  });
});
