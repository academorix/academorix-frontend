/**
 * @file memory-store.test.ts
 * @description Integration test for MemoryStore using @stackra/testing infrastructure.
 *   Demonstrates the full DX of the testing package.
 */

import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { freezeTime, travelTo, restoreTime } from "@stackra/testing";
import { registerAllMatchers } from "@stackra/testing/matchers";
import { MemoryStore } from "@/core/stores/memory.store";

// Register custom matchers
beforeAll(() => {
  registerAllMatchers();
});

describe("MemoryStore", () => {
  let store: MemoryStore;

  beforeEach(() => {
    store = new MemoryStore();
    restoreTime();
  });

  // ==========================================================================
  // Basic CRUD
  // ==========================================================================

  describe("get/set", () => {
    it("stores and retrieves a string value", async () => {
      await store.set("name", "Alice");
      const result = await store.get<string>("name");
      expect(result).toBe("Alice");
    });

    it("stores and retrieves an object value", async () => {
      const user = { id: "1", name: "Bob", active: true };
      await store.set("user:1", user);
      const result = await store.get<typeof user>("user:1");
      expect(result).toEqual(user);
    });

    it("returns undefined for missing keys", async () => {
      const result = await store.get("nonexistent");
      expect(result).toBeUndefined();
    });
  });

  describe("has", () => {
    it("returns true for existing keys", async () => {
      await store.set("exists", "yes");
      expect(await store.has("exists")).toBe(true);
    });

    it("returns false for missing keys", async () => {
      expect(await store.has("nope")).toBe(false);
    });
  });

  describe("delete", () => {
    it("removes a key and returns true", async () => {
      await store.set("key", "val");
      const deleted = await store.delete("key");
      expect(deleted).toBe(true);
      expect(await store.get("key")).toBeUndefined();
    });

    it("returns false for non-existent keys", async () => {
      expect(await store.delete("missing")).toBe(false);
    });
  });

  describe("clear", () => {
    it("removes all entries", async () => {
      await store.set("a", 1);
      await store.set("b", 2);
      await store.set("c", 3);
      await store.clear();
      expect(await store.has("a")).toBe(false);
      expect(await store.has("b")).toBe(false);
      expect(await store.has("c")).toBe(false);
    });
  });

  // ==========================================================================
  // TTL / Expiry (using freezeTime from @stackra/testing)
  // ==========================================================================

  describe("TTL expiry", () => {
    it("returns value before TTL expires", async () => {
      freezeTime("2025-01-01T00:00:00Z");
      await store.set("key", "value", 60); // 60 seconds TTL

      // Travel 30 seconds into the future (still within TTL)
      travelTo("2025-01-01T00:00:30Z");
      const result = await store.get("key");
      expect(result).toBe("value");
    });

    it("returns undefined after TTL expires", async () => {
      freezeTime("2025-01-01T00:00:00Z");
      await store.set("key", "value", 60); // 60 seconds TTL

      // Travel 61 seconds into the future (past TTL)
      travelTo("2025-01-01T00:01:01Z");
      const result = await store.get("key");
      expect(result).toBeUndefined();
    });

    it("has() returns false for expired keys", async () => {
      freezeTime("2025-01-01T00:00:00Z");
      await store.set("temp", "data", 10);

      travelTo("2025-01-01T00:00:11Z");
      expect(await store.has("temp")).toBe(false);
    });

    it("forever() never expires", async () => {
      freezeTime("2025-01-01T00:00:00Z");
      await store.forever("permanent", "forever-value");

      // Travel 1 year into the future
      travelTo("2026-01-01T00:00:00Z");
      expect(await store.get("permanent")).toBe("forever-value");
    });
  });

  // ==========================================================================
  // Atomic Operations
  // ==========================================================================

  describe("increment / decrement", () => {
    it("increments from 0 if key does not exist", async () => {
      const result = await store.increment("counter");
      expect(result).toBe(1);
    });

    it("increments existing numeric value", async () => {
      await store.set("counter", 5);
      const result = await store.increment("counter", 3);
      expect(result).toBe(8);
    });

    it("decrements correctly", async () => {
      await store.set("counter", 10);
      const result = await store.decrement("counter", 4);
      expect(result).toBe(6);
    });

    it("preserves TTL on increment", async () => {
      freezeTime("2025-01-01T00:00:00Z");
      await store.set("counter", 5, 60);
      await store.increment("counter");

      // Still alive at 30s
      travelTo("2025-01-01T00:00:30Z");
      expect(await store.get("counter")).toBe(6);

      // Expired at 61s
      travelTo("2025-01-01T00:01:01Z");
      expect(await store.get("counter")).toBeUndefined();
    });
  });

  // ==========================================================================
  // Batch Operations
  // ==========================================================================

  describe("many / setMany", () => {
    it("retrieves multiple values at once", async () => {
      await store.set("a", 1);
      await store.set("b", 2);
      await store.set("c", 3);

      const results = await store.many<number>(["a", "b", "c", "missing"]);
      expect(results.get("a")).toBe(1);
      expect(results.get("b")).toBe(2);
      expect(results.get("c")).toBe(3);
      expect(results.get("missing")).toBeUndefined();
    });

    it("stores multiple values at once", async () => {
      const entries = new Map<string, number>([
        ["x", 10],
        ["y", 20],
        ["z", 30],
      ]);
      await store.setMany(entries, 120);

      expect(await store.get("x")).toBe(10);
      expect(await store.get("y")).toBe(20);
      expect(await store.get("z")).toBe(30);
    });
  });

  // ==========================================================================
  // Touch (extend TTL)
  // ==========================================================================

  describe("touch", () => {
    it("extends TTL of existing key", async () => {
      freezeTime("2025-01-01T00:00:00Z");
      await store.set("key", "val", 30); // expires at :30

      travelTo("2025-01-01T00:00:25Z"); // 5s before expiry
      await store.touch("key", 60); // extend to 60s from now

      travelTo("2025-01-01T00:01:20Z"); // 80s from start, but only 55s from touch
      expect(await store.get("key")).toBe("val");
    });

    it("returns false for non-existent keys", async () => {
      expect(await store.touch("missing", 60)).toBe(false);
    });

    it("returns false for expired keys", async () => {
      freezeTime("2025-01-01T00:00:00Z");
      await store.set("key", "val", 10);

      travelTo("2025-01-01T00:00:11Z");
      expect(await store.touch("key", 60)).toBe(false);
    });
  });
});
