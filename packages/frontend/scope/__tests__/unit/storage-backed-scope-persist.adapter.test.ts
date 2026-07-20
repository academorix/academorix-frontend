/**
 * @file storage-backed-scope-persist.adapter.test.ts
 * @module @stackra/scope/__tests__/unit
 * @description Behavioural tests for
 *   {@link StorageBackedScopePersistAdapter} — verifies key
 *   namespacing, round-trip through the manager, empty-string
 *   handling, and adapter-level fail-soft semantics inherited from
 *   the underlying `IStorage`.
 *
 *   No AsyncStorage / localStorage mocking needed — the manager is
 *   an in-memory `MockStorageManager` from `@stackra/storage/testing`.
 */

import { describe, it, expect, beforeEach } from "vitest";

import { MockStorageManager } from "@stackra/storage/testing";

import { StorageBackedScopePersistAdapter } from "@/core/adapters/storage-backed-scope-persist.adapter";

const DEFAULT_KEY = "@stackra:scope:active_node_id";

describe("StorageBackedScopePersistAdapter", () => {
  let manager: MockStorageManager;

  beforeEach(() => {
    manager = new MockStorageManager();
  });

  it("persist + restore round-trip through the manager default instance", async () => {
    const adapter = new StorageBackedScopePersistAdapter(manager);
    await adapter.persist("node-abc");
    expect(await adapter.restore()).toBe("node-abc");
  });

  it("writes under the default namespaced key", async () => {
    const adapter = new StorageBackedScopePersistAdapter(manager);
    await adapter.persist("node-xyz");
    const store = manager.instance();
    expect(await store.get<string>(DEFAULT_KEY)).toBe("node-xyz");
  });

  it("honours a custom storageKey", async () => {
    const adapter = new StorageBackedScopePersistAdapter(manager, {
      storageKey: "@custom:key",
    });
    await adapter.persist("node-1");
    const store = manager.instance();
    expect(await store.get<string>("@custom:key")).toBe("node-1");
    expect(await store.get<string>(DEFAULT_KEY)).toBeNull();
  });

  it("routes to a named IStorage instance when `storage` is set", async () => {
    manager.setDefaultInstance("other");
    const adapter = new StorageBackedScopePersistAdapter(manager, {
      storage: "preferences",
    });
    await adapter.persist("node-2");
    // The write should land on the "preferences" instance, not "other".
    expect(await manager.instance("preferences").get<string>(DEFAULT_KEY)).toBe("node-2");
    expect(await manager.instance("other").get<string>(DEFAULT_KEY)).toBeNull();
  });

  it("restore returns null when the store is empty", async () => {
    const adapter = new StorageBackedScopePersistAdapter(manager);
    expect(await adapter.restore()).toBeNull();
  });

  it("restore returns null for an empty string in storage", async () => {
    const adapter = new StorageBackedScopePersistAdapter(manager);
    await manager.instance().set(DEFAULT_KEY, "");
    expect(await adapter.restore()).toBeNull();
  });

  it("clear removes the persisted id", async () => {
    const adapter = new StorageBackedScopePersistAdapter(manager);
    await adapter.persist("node-a");
    await adapter.clear();
    expect(await adapter.restore()).toBeNull();
    expect(await manager.instance().has(DEFAULT_KEY)).toBe(false);
  });
});
