/**
 * @file storage-store.spec.ts
 * @module @stackra/cache/__tests__/unit
 * @description Behavioural spec for `StorageStore` — the cache
 *   store that composes over `IStorage` from `@stackra/storage`.
 *
 *   Uses `MockStorageManager` from `@stackra/storage/testing`; no
 *   real localStorage / IndexedDB touched. `Date.now` is mocked
 *   with `vi.spyOn(Date, 'now')` and restored in `afterEach`.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { MockStorageManager } from "@stackra/storage/testing";

import { StorageStore } from "@/core/stores/storage.store";
import type { IStorageStoreOptions } from "@/core/interfaces/storage-store-options.interface";

// ════════════════════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════════════════════

const DEFAULT_INSTANCE = "localStorage";

/** Build a `StorageStore` fed a fresh mock storage manager. */
function makeStore(options: IStorageStoreOptions = {}): {
  store: StorageStore;
  manager: MockStorageManager;
} {
  const manager = new MockStorageManager();
  const store = new StorageStore(manager, options);
  return { store, manager };
}

describe("StorageStore", () => {
  let nowSpy: ReturnType<typeof vi.spyOn> | null = null;

  beforeEach(() => {
    nowSpy = null;
  });

  afterEach(() => {
    nowSpy?.mockRestore();
    nowSpy = null;
  });

  describe("get / set", () => {
    it("stores and retrieves a value under the configured prefix", async () => {
      const { store, manager } = makeStore();
      await store.set("theme", "dark");
      expect(await store.get<string>("theme")).toBe("dark");
      // Prefix isolation — the raw key is written as `cache:theme`.
      expect(await manager.instance(DEFAULT_INSTANCE).has("cache:theme")).toBe(true);
    });

    it("returns undefined for missing keys", async () => {
      const { store } = makeStore();
      expect(await store.get("nope")).toBeUndefined();
    });

    it("routes to the storage instance named by `storage`", async () => {
      const { store, manager } = makeStore({ storage: "sessionStorage" });
      await store.set("x", 1);
      // The write MUST have landed on `sessionStorage`, not the
      // default `localStorage`.
      expect(await manager.instance("sessionStorage").get("cache:x")).not.toBeNull();
      expect(await manager.instance("localStorage").has("cache:x")).toBe(false);
    });

    it("falls back to sessionStorage when `session: true`", async () => {
      const { store, manager } = makeStore({ session: true });
      await store.set("x", 1);
      expect(await manager.instance("sessionStorage").has("cache:x")).toBe(true);
      expect(await manager.instance("localStorage").has("cache:x")).toBe(false);
    });
  });

  describe("TTL expiry", () => {
    it("returns undefined once the ttl elapses", async () => {
      nowSpy = vi.spyOn(Date, "now").mockReturnValue(1_000_000);
      const { store } = makeStore();
      await store.set("temp", "v", 60); // 60s ttl

      // 30s later — still alive.
      nowSpy.mockReturnValue(1_000_000 + 30_000);
      expect(await store.get("temp")).toBe("v");

      // 61s later — expired.
      nowSpy.mockReturnValue(1_000_000 + 61_000);
      expect(await store.get("temp")).toBeUndefined();
    });

    it("has() reports false for an expired key AND cleans it up", async () => {
      nowSpy = vi.spyOn(Date, "now").mockReturnValue(0);
      const { store, manager } = makeStore();
      await store.set("temp", "v", 1); // 1s ttl

      nowSpy.mockReturnValue(2_000);
      expect(await store.has("temp")).toBe(false);
      // The passive expiry sweep removed the key from the backing store.
      expect(await manager.instance(DEFAULT_INSTANCE).has("cache:temp")).toBe(false);
    });

    it("forever() writes an entry with no ttl", async () => {
      nowSpy = vi.spyOn(Date, "now").mockReturnValue(0);
      const { store } = makeStore();
      await store.forever("perm", "value");

      // Move way past any reasonable ttl.
      nowSpy.mockReturnValue(1_000_000_000);
      expect(await store.get("perm")).toBe("value");
    });
  });

  describe("increment / decrement", () => {
    it("increments an existing numeric value", async () => {
      const { store } = makeStore();
      await store.set("count", 5);
      expect(await store.increment("count", 3)).toBe(8);
      expect(await store.get("count")).toBe(8);
    });

    it("initialises to 0 when the key is missing", async () => {
      const { store } = makeStore();
      expect(await store.increment("newkey")).toBe(1);
    });

    it("preserves ttl metadata on increment", async () => {
      nowSpy = vi.spyOn(Date, "now").mockReturnValue(0);
      const { store } = makeStore();
      await store.set("counter", 1, 60); // 60s ttl
      // Freeze time so `createdAt` is deterministic.
      nowSpy.mockReturnValue(1_000);
      await store.increment("counter");

      // Value survives at 30s.
      nowSpy.mockReturnValue(30_000);
      expect(await store.get("counter")).toBe(2);

      // Expires at 61s from ORIGINAL creation.
      nowSpy.mockReturnValue(61_000);
      expect(await store.get("counter")).toBeUndefined();
    });

    it("decrement is increment(-by)", async () => {
      const { store } = makeStore();
      await store.set("count", 10);
      expect(await store.decrement("count", 3)).toBe(7);
    });
  });

  describe("touch", () => {
    it("extends the ttl without changing the value", async () => {
      nowSpy = vi.spyOn(Date, "now").mockReturnValue(0);
      const { store } = makeStore();
      await store.set("token", "abc", 30); // expires at t=30s

      nowSpy.mockReturnValue(25_000);
      const touched = await store.touch("token", 60); // extend to +60s from now
      expect(touched).toBe(true);

      // At t=75s (50s after touch), still alive.
      nowSpy.mockReturnValue(75_000);
      expect(await store.get("token")).toBe("abc");

      // At t=90s (65s after touch), expired.
      nowSpy.mockReturnValue(90_000);
      expect(await store.get("token")).toBeUndefined();
    });

    it("returns false for a missing key", async () => {
      const { store } = makeStore();
      expect(await store.touch("missing", 60)).toBe(false);
    });

    it("returns false for an already-expired key", async () => {
      nowSpy = vi.spyOn(Date, "now").mockReturnValue(0);
      const { store } = makeStore();
      await store.set("k", "v", 10);
      nowSpy.mockReturnValue(11_000);
      expect(await store.touch("k", 30)).toBe(false);
    });
  });

  describe("many / setMany", () => {
    it("many() reads a batch", async () => {
      const { store } = makeStore();
      await store.set("a", 1);
      await store.set("b", 2);
      const map = await store.many<number>(["a", "b", "c"]);
      expect(map.get("a")).toBe(1);
      expect(map.get("b")).toBe(2);
      expect(map.get("c")).toBeUndefined();
    });

    it("setMany() writes a batch with a shared ttl", async () => {
      nowSpy = vi.spyOn(Date, "now").mockReturnValue(0);
      const { store } = makeStore();
      await store.setMany(
        new Map([
          ["x", "X"],
          ["y", "Y"],
        ]),
        60,
      );

      expect(await store.get("x")).toBe("X");
      expect(await store.get("y")).toBe("Y");

      // Both expire past the shared ttl.
      nowSpy.mockReturnValue(61_000);
      expect(await store.get("x")).toBeUndefined();
      expect(await store.get("y")).toBeUndefined();
    });
  });

  describe("prefix isolation", () => {
    it("clear() only removes keys under this store prefix", async () => {
      const { store, manager } = makeStore({ prefix: "app:" });
      const backing = manager.instance(DEFAULT_INSTANCE);

      // Own keys — under the `app:` prefix.
      await store.set("theme", "dark");
      await store.set("locale", "en");

      // Foreign key — someone else sharing the same IStorage instance.
      await backing.set("other:setting", "external");

      await store.clear();

      expect(await backing.has("app:theme")).toBe(false);
      expect(await backing.has("app:locale")).toBe(false);
      // Foreign key untouched.
      expect(await backing.get("other:setting")).toBe("external");
    });

    it("delete() reports whether the key existed", async () => {
      const { store } = makeStore();
      await store.set("present", 1);
      expect(await store.delete("present")).toBe(true);
      expect(await store.delete("absent")).toBe(false);
    });
  });

  describe("max-entry eviction", () => {
    it("drops the oldest entry once the count exceeds maxEntries", async () => {
      nowSpy = vi.spyOn(Date, "now");
      const { store } = makeStore({ maxEntries: 2 });

      nowSpy.mockReturnValue(1_000);
      await store.set("a", 1);
      nowSpy.mockReturnValue(2_000);
      await store.set("b", 2);
      nowSpy.mockReturnValue(3_000);
      await store.set("c", 3); // eviction triggers — `a` is oldest.

      expect(await store.get("a")).toBeUndefined();
      expect(await store.get("b")).toBe(2);
      expect(await store.get("c")).toBe(3);
    });

    it("is disabled when maxEntries is 0", async () => {
      nowSpy = vi.spyOn(Date, "now");
      const { store } = makeStore({ maxEntries: 0 });
      nowSpy.mockReturnValue(1);
      await store.set("a", 1);
      nowSpy.mockReturnValue(2);
      await store.set("b", 2);
      nowSpy.mockReturnValue(3);
      await store.set("c", 3);
      // All three are still present — no eviction.
      expect(await store.get("a")).toBe(1);
      expect(await store.get("b")).toBe(2);
      expect(await store.get("c")).toBe(3);
    });
  });
});
