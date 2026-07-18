/**
 * @file indexeddb-connector.spec.ts
 * @module @stackra/queue/__tests__/unit
 * @description Behavioural spec for `IndexedDBConnector` +
 *   `IndexedDBConnection`. The connector shape is identical to
 *   `LocalStorageConnector` — the only material difference is the
 *   default storage instance name (`'indexedDB'`).
 *
 *   Uses `MockStorageManager` from `@stackra/storage/testing`; no
 *   real IndexedDB touched.
 */

import { describe, it, expect, beforeEach } from "vitest";

import { MockStorageManager } from "@stackra/storage/testing";

import { IndexedDBConnector } from "@/core/connectors/indexeddb.connector";
import type { IQueueConnection } from "@/core/interfaces";

describe("IndexedDBConnector", () => {
  let manager: MockStorageManager;
  let connector: IndexedDBConnector;
  let connection: IQueueConnection;

  beforeEach(async () => {
    manager = new MockStorageManager();
    connector = new IndexedDBConnector(manager);
    connection = await connector.connect({ driver: "indexeddb" });
  });

  it("defaults the storage instance to `indexedDB` (not localStorage)", async () => {
    await connection.push("a", {});
    expect(await manager.instance("indexedDB").has("queue:default")).toBe(true);
    expect(await manager.instance("localStorage").has("queue:default")).toBe(false);
  });

  describe("push / pop", () => {
    it("pop drains FIFO by createdAt", async () => {
      await connection.push("a", {});
      await connection.push("b", {});
      await connection.push("c", {});

      expect((await connection.pop())?.name).toBe("a");
      expect((await connection.pop())?.name).toBe("b");
      expect((await connection.pop())?.name).toBe("c");
    });

    it("pop returns null for an empty queue", async () => {
      expect(await connection.pop()).toBeNull();
    });
  });

  describe("size", () => {
    it("counts per named queue", async () => {
      await connection.push("a", {}, { queue: "emails" });
      await connection.push("b", {}, { queue: "payments" });
      await connection.push("c", {}, { queue: "emails" });

      expect(await connection.size("emails")).toBe(2);
      expect(await connection.size("payments")).toBe(1);
    });
  });

  describe("remove", () => {
    it("scans every queue for the id", async () => {
      await connection.push("a", {}, { queue: "q1" });
      const id2 = await connection.push("b", {}, { queue: "q2" });
      await connection.remove(id2);

      expect(await connection.size("q1")).toBe(1);
      expect(await connection.size("q2")).toBe(0);
    });
  });

  describe("clear", () => {
    it("scopes to a single queue", async () => {
      await connection.push("a", {}, { queue: "x" });
      await connection.push("b", {}, { queue: "y" });
      await connection.clear("x");

      expect(await connection.size("x")).toBe(0);
      expect(await connection.size("y")).toBe(1);
    });
  });

  describe("bulk", () => {
    it("pushes multiple jobs at once", async () => {
      const ids = await connection.bulk([
        { name: "a", data: {} },
        { name: "b", data: {} },
      ]);
      expect(ids).toHaveLength(2);
      expect(await connection.size()).toBe(2);
    });
  });

  describe("max-entries eviction", () => {
    it("trims oldest jobs beyond the cap", async () => {
      const conn = await connector.connect({ driver: "indexeddb", maxEntries: 2 });
      await conn.push("a", {});
      await conn.push("b", {});
      await conn.push("c", {});

      expect(await conn.size()).toBe(2);
      expect((await conn.pop())?.name).toBe("b");
      expect((await conn.pop())?.name).toBe("c");
    });
  });

  describe("routing via `storage` config", () => {
    it("honours an explicit storage instance name", async () => {
      const conn = await connector.connect({ driver: "indexeddb", storage: "custom" });
      await conn.push("a", {});
      expect(await manager.instance("custom").has("queue:default")).toBe(true);
      expect(await manager.instance("indexedDB").has("queue:default")).toBe(false);
    });
  });
});
