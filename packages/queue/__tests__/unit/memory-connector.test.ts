/**
 * @file memory-connector.test.ts
 * @description Tests for the MemoryConnector queue driver using @stackra/testing.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { MemoryConnector } from "@/core/connectors/memory.connector";
import type { IQueueConnection } from "@/core/interfaces";

describe("MemoryConnector", () => {
  let connector: MemoryConnector;
  let connection: IQueueConnection;

  beforeEach(async () => {
    connector = new MemoryConnector();
    connection = await connector.connect({ driver: "memory" });
  });

  // ==========================================================================
  // Push / Pop (FIFO)
  // ==========================================================================

  describe("push / pop", () => {
    it("pushes a job and returns an ID", async () => {
      const id = await connection.push("send-email", { to: "user@test.com" });
      expect(id).toBeDefined();
      expect(id).toMatch(/^mem_\d+$/);
    });

    it("pops jobs in FIFO order", async () => {
      await connection.push("job-1", { seq: 1 });
      await connection.push("job-2", { seq: 2 });
      await connection.push("job-3", { seq: 3 });

      const first = await connection.pop();
      const second = await connection.pop();
      const third = await connection.pop();

      expect(first?.name).toBe("job-1");
      expect(second?.name).toBe("job-2");
      expect(third?.name).toBe("job-3");
    });

    it("pop returns null when queue is empty", async () => {
      const result = await connection.pop();
      expect(result).toBeNull();
    });

    it("supports named queues", async () => {
      await connection.push("job-a", {}, { queue: "high" });
      await connection.push("job-b", {}, { queue: "low" });

      const high = await connection.pop("high");
      const low = await connection.pop("low");
      const defaultQ = await connection.pop("default");

      expect(high?.name).toBe("job-a");
      expect(low?.name).toBe("job-b");
      expect(defaultQ).toBeNull();
    });
  });

  // ==========================================================================
  // Size
  // ==========================================================================

  describe("size", () => {
    it("returns 0 for empty queue", async () => {
      expect(await connection.size()).toBe(0);
    });

    it("reflects current queue length", async () => {
      await connection.push("a", {});
      await connection.push("b", {});
      await connection.push("c", {});

      expect(await connection.size()).toBe(3);

      await connection.pop();
      expect(await connection.size()).toBe(2);
    });

    it("counts per named queue", async () => {
      await connection.push("job", {}, { queue: "emails" });
      await connection.push("job", {}, { queue: "emails" });
      await connection.push("job", {}, { queue: "payments" });

      expect(await connection.size("emails")).toBe(2);
      expect(await connection.size("payments")).toBe(1);
      expect(await connection.size("default")).toBe(0);
    });
  });

  // ==========================================================================
  // Bulk push
  // ==========================================================================

  describe("bulk", () => {
    it("pushes multiple jobs at once", async () => {
      const ids = await connection.bulk([
        { name: "job-1", data: { a: 1 } },
        { name: "job-2", data: { b: 2 } },
        { name: "job-3", data: { c: 3 } },
      ]);

      expect(ids).toHaveLength(3);
      expect(await connection.size()).toBe(3);
    });
  });

  // ==========================================================================
  // Remove
  // ==========================================================================

  describe("remove", () => {
    it("removes a specific job by ID", async () => {
      const id1 = await connection.push("keep", {});
      const id2 = await connection.push("remove-me", {});
      await connection.push("keep-too", {});

      await connection.remove(id2);
      expect(await connection.size()).toBe(2);

      const first = await connection.pop();
      expect(first?.name).toBe("keep");
    });
  });

  // ==========================================================================
  // Clear / Close
  // ==========================================================================

  describe("clear / close", () => {
    it("clear removes all jobs from a specific queue", async () => {
      await connection.push("a", {});
      await connection.push("b", {});
      await connection.clear();

      expect(await connection.size()).toBe(0);
    });

    it("close clears all queues", async () => {
      await connection.push("a", {}, { queue: "q1" });
      await connection.push("b", {}, { queue: "q2" });
      await connection.close();

      expect(await connection.size("q1")).toBe(0);
      expect(await connection.size("q2")).toBe(0);
    });
  });

  // ==========================================================================
  // Job structure
  // ==========================================================================

  describe("job structure", () => {
    it("popped job has correct fields", async () => {
      await connection.push("process-order", { orderId: "abc" }, { tries: 3 });
      const job = await connection.pop();

      expect(job).not.toBeNull();
      expect(job!.id).toBeDefined();
      expect(job!.name).toBe("process-order");
      expect(job!.data).toEqual({ orderId: "abc" });
      expect(job!.attempts).toBe(0);
      expect(job!.maxAttempts).toBe(3);
      expect(job!.queue).toBe("default");
      expect(job!.createdAt).toBeGreaterThan(0);
    });
  });
});
