/**
 * @file checkpoint-service.spec.ts
 * @module @stackra/sync/__tests__/unit
 * @description Behavioural spec for the `CheckpointService` — the
 *   sync engine's per-collection cursor persistence. Uses
 *   `MockStorageManager` from `@stackra/storage/testing`; no real
 *   IndexedDB touched.
 *
 *   Covers: `save` / `load` round-trip, `loadAll` under the shared
 *   prefix, per-collection `delete` and `deleteAll`, the fail-soft
 *   no-op path when no manager is provided, and instance routing
 *   via `ISyncModuleOptions.storage`.
 */

import { describe, it, expect, beforeEach } from "vitest";

import { MockStorageManager } from "@stackra/storage/testing";

import type { ISyncCheckpoint, ISyncModuleOptions } from "@stackra/contracts";

import { CheckpointService } from "@/core/services/checkpoint.service";

const KEY_PREFIX = "sync:checkpoint:";
const DEFAULT_INSTANCE = "indexedDB";

function makeCheckpoint(collection: string): ISyncCheckpoint {
  return {
    collection,
    pullCursor: `cursor-for-${collection}`,
    lastPullAt: new Date("2026-07-14T00:00:00Z"),
    lastPushAt: null,
    lastSyncAt: new Date("2026-07-14T00:00:00Z"),
    lastSyncCount: 3,
    createdAt: new Date("2026-07-14T00:00:00Z"),
    version: 1,
  };
}

describe("CheckpointService", () => {
  let manager: MockStorageManager;

  beforeEach(() => {
    manager = new MockStorageManager();
  });

  describe("save / load round-trip", () => {
    it("persists a checkpoint under the default indexedDB instance", async () => {
      const service = new CheckpointService(manager);
      const checkpoint = makeCheckpoint("users");

      await service.save("users", checkpoint);
      const loaded = await service.load("users");

      expect(loaded).toEqual(checkpoint);
      // The key is `sync:checkpoint:${collection}` on the default instance.
      expect(await manager.instance(DEFAULT_INSTANCE).has(`${KEY_PREFIX}users`)).toBe(true);
    });

    it("load() returns null for a missing collection", async () => {
      const service = new CheckpointService(manager);
      expect(await service.load("missing")).toBeNull();
    });
  });

  describe("loadAll", () => {
    it("returns every checkpoint under the shared prefix", async () => {
      const service = new CheckpointService(manager);
      const users = makeCheckpoint("users");
      const orders = makeCheckpoint("orders");

      await service.save("users", users);
      await service.save("orders", orders);

      const all = await service.loadAll();

      expect(all).toHaveLength(2);
      expect(all).toEqual(expect.arrayContaining([users, orders]));
    });

    it("ignores keys outside the checkpoint prefix", async () => {
      const service = new CheckpointService(manager);
      const users = makeCheckpoint("users");
      await service.save("users", users);

      // Something else writes to the same IStorage instance.
      await manager.instance(DEFAULT_INSTANCE).set("other:setting", "external");

      const all = await service.loadAll();
      expect(all).toHaveLength(1);
      expect(all[0]).toEqual(users);
    });

    it("returns an empty array when nothing has been persisted", async () => {
      const service = new CheckpointService(manager);
      expect(await service.loadAll()).toEqual([]);
    });
  });

  describe("delete / deleteAll", () => {
    it("delete removes a single collection only", async () => {
      const service = new CheckpointService(manager);
      await service.save("users", makeCheckpoint("users"));
      await service.save("orders", makeCheckpoint("orders"));

      await service.delete("users");

      expect(await service.load("users")).toBeNull();
      expect(await service.load("orders")).not.toBeNull();
    });

    it("deleteAll clears every checkpoint under the prefix", async () => {
      const service = new CheckpointService(manager);
      await service.save("users", makeCheckpoint("users"));
      await service.save("orders", makeCheckpoint("orders"));

      // Foreign key — must survive deleteAll.
      await manager.instance(DEFAULT_INSTANCE).set("other:setting", "external");

      await service.deleteAll();

      expect(await service.load("users")).toBeNull();
      expect(await service.load("orders")).toBeNull();
      // Foreign key intact.
      expect(await manager.instance(DEFAULT_INSTANCE).get("other:setting")).toBe("external");
    });

    it("delete on an unknown collection is a no-op", async () => {
      const service = new CheckpointService(manager);
      await expect(service.delete("never")).resolves.not.toThrow();
    });
  });

  describe("storage instance routing", () => {
    it("reads/writes from the instance named by `ISyncModuleOptions.storage`", async () => {
      const options: ISyncModuleOptions = {
        baseUrl: "https://api.example",
        storage: "custom-store",
      };
      const service = new CheckpointService(manager, options);

      await service.save("users", makeCheckpoint("users"));

      expect(await manager.instance("custom-store").has(`${KEY_PREFIX}users`)).toBe(true);
      // Nothing landed on the default IndexedDB instance.
      expect(await manager.instance(DEFAULT_INSTANCE).has(`${KEY_PREFIX}users`)).toBe(false);
    });
  });

  describe("soft no-op when no manager is provided", () => {
    it("load() returns null instead of throwing", async () => {
      const service = new CheckpointService();
      expect(await service.load("users")).toBeNull();
    });

    it("loadAll() returns an empty array", async () => {
      const service = new CheckpointService();
      expect(await service.loadAll()).toEqual([]);
    });

    it("save() silently returns", async () => {
      const service = new CheckpointService();
      await expect(service.save("users", makeCheckpoint("users"))).resolves.toBeUndefined();
    });

    it("delete() / deleteAll() are silent no-ops", async () => {
      const service = new CheckpointService();
      await expect(service.delete("users")).resolves.toBeUndefined();
      await expect(service.deleteAll()).resolves.toBeUndefined();
    });
  });
});
