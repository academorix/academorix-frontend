/**
 * @file local-storage-connector.spec.ts
 * @module @stackra/queue/__tests__/unit
 * @description Behavioural spec for the `LocalStorageConnector` +
 *   `LocalStorageConnection` — verifies FIFO ordering, per-queue
 *   `size` counting, cross-queue `remove`, prefix isolation on
 *   `clear`, and the max-entries eviction sweep.
 *
 *   Uses `MockStorageManager` from `@stackra/storage/testing` —
 *   nothing touches real localStorage.
 */

import { describe, it, expect, beforeEach } from "vitest";

import { MockStorageManager } from "@stackra/storage/testing";

import { LocalStorageConnector } from "@/core/connectors/local-storage.connector";
import type { IQueueConnection } from "@/core/interfaces";

describe("LocalStorageConnector", () => {
  let manager: MockStorageManager;
  let connector: LocalStorageConnector;
  let connection: IQueueConnection;

  beforeEach(async () => {
    manager = new MockStorageManager();
    connector = new LocalStorageConnector(manager);
    connection = await connector.connect({ driver: "local-storage" });
  });

  describe("push / pop", () => {
    it("push stores the job under `queue:<queueName>` on the default instance", async () => {
      const id = await connection.push("send-email", { to: "alice" });
      expect(id).toBeDefined();
      const raw = await manager.instance("localStorage").get<unknown[]>("queue:default");
      expect(Array.isArray(raw)).toBe(true);
      expect(raw?.length).toBe(1);
    });

    it("pop drains FIFO by createdAt", async () => {
      // Push three jobs — createdAt is `Date.now()` at insertion so
      // ordering is guaranteed by insertion order.
      await connection.push("a", {});
      await connection.push("b", {});
      await connection.push("c", {});

      expect((await connection.pop())?.name).toBe("a");
      expect((await connection.pop())?.name).toBe("b");
      expect((await connection.pop())?.name).toBe("c");
      expect(await connection.pop()).toBeNull();
    });

    it("pop returns null for an empty queue", async () => {
      expect(await connection.pop()).toBeNull();
    });

    it("routes named queues under distinct storage keys", async () => {
      await connection.push("a", {}, { queue: "high" });
      await connection.push("b", {}, { queue: "low" });

      const storage = manager.instance("localStorage");
      expect(await storage.has("queue:high")).toBe(true);
      expect(await storage.has("queue:low")).toBe(true);

      const high = await connection.pop("high");
      const low = await connection.pop("low");
      expect(high?.name).toBe("a");
      expect(low?.name).toBe("b");
    });
  });

  describe("size", () => {
    it("counts jobs per queue", async () => {
      await connection.push("a", {}, { queue: "emails" });
      await connection.push("b", {}, { queue: "emails" });
      await connection.push("c", {}, { queue: "payments" });

      expect(await connection.size("emails")).toBe(2);
      expect(await connection.size("payments")).toBe(1);
      expect(await connection.size("default")).toBe(0);
    });
  });

  describe("remove", () => {
    it("searches every queue for the id", async () => {
      const id1 = await connection.push("a", {}, { queue: "q1" });
      await connection.push("b", {}, { queue: "q2" });

      await connection.remove(id1);

      expect(await connection.size("q1")).toBe(0);
      expect(await connection.size("q2")).toBe(1);
    });

    it("is a no-op for an unknown id", async () => {
      await connection.push("a", {}, { queue: "q1" });
      await expect(connection.remove("never")).resolves.not.toThrow();
      expect(await connection.size("q1")).toBe(1);
    });
  });

  describe("clear", () => {
    it("deletes a specific queue only", async () => {
      await connection.push("a", {}, { queue: "x" });
      await connection.push("b", {}, { queue: "y" });

      await connection.clear("x");

      expect(await connection.size("x")).toBe(0);
      expect(await connection.size("y")).toBe(1);
    });
  });

  describe("later + bulk", () => {
    it("later delegates to push (no scheduled delivery in the storage layer)", async () => {
      const id = await connection.later(60_000, "delayed", {});
      expect(id).toBeDefined();
      // The job is immediately available for pop.
      const job = await connection.pop();
      expect(job?.name).toBe("delayed");
    });

    it("bulk pushes every job in one call", async () => {
      const ids = await connection.bulk([
        { name: "a", data: {} },
        { name: "b", data: {} },
        { name: "c", data: {} },
      ]);
      expect(ids).toHaveLength(3);
      expect(await connection.size()).toBe(3);
    });
  });

  describe("max-entries eviction", () => {
    it("trims oldest jobs once the queue exceeds maxEntries", async () => {
      // Fresh connection with a low cap.
      const conn = await connector.connect({ driver: "local-storage", maxEntries: 2 });

      await conn.push("a", {});
      await conn.push("b", {});
      await conn.push("c", {}); // 3rd triggers eviction — `a` (oldest) drops.

      expect(await conn.size()).toBe(2);
      const first = await conn.pop();
      const second = await conn.pop();
      expect([first?.name, second?.name]).toEqual(["b", "c"]);
    });
  });

  describe("close", () => {
    it("leaves the storage layer alive across connections", async () => {
      await connection.push("a", {});
      await connection.close();

      // A brand-new connection can still read the persisted queue.
      const rebuilt = await connector.connect({ driver: "local-storage" });
      const job = await rebuilt.pop();
      expect(job?.name).toBe("a");
    });
  });

  describe("routing via `storage` config", () => {
    it("reads / writes on the named storage instance", async () => {
      const conn = await connector.connect({
        driver: "local-storage",
        storage: "sessionStorage",
      });
      await conn.push("a", {});

      expect(await manager.instance("sessionStorage").has("queue:default")).toBe(true);
      expect(await manager.instance("localStorage").has("queue:default")).toBe(false);
    });
  });
});
