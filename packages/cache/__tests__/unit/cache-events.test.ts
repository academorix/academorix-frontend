/**
 * @file cache-events.test.ts
 * @description Verifies that `CacheService` emits the canonical
 *   `CACHE_EVENTS` on the optional event emitter for every lifecycle
 *   operation — hits, misses, writes, deletes, flushes, counter ops,
 *   touch — and is fail-soft when no emitter is wired.
 */

import { beforeEach, describe, expect, it } from "vitest";

import { CACHE_EVENTS } from "@stackra/contracts";
import type { IEventEmitter } from "@stackra/contracts";

import { CacheManager } from "@/core/services/cache-manager.service";
import { CacheService } from "@/core/services/cache.service";
import type { ICacheModuleConfig } from "@/core/interfaces";

// ════════════════════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════════════════════

/** Tiny capturing event emitter — records every emit call. */
function createRecordingEmitter(): IEventEmitter & {
  events: Array<{ event: string; payload: unknown }>;
  reset(): void;
} {
  const events: Array<{ event: string; payload: unknown }> = [];
  return {
    events,
    emit(event: string, payload?: unknown) {
      events.push({ event, payload });
      return Promise.resolve();
    },
    on() {
      return () => {};
    },
    eventNames() {
      return [];
    },
    listenerCount() {
      return 0;
    },
    removeAllListeners() {},
    reset() {
      events.length = 0;
    },
  };
}

function makeService(emitter?: IEventEmitter): { service: CacheService } {
  const config: ICacheModuleConfig = {
    default: "memory",
    stores: { memory: { driver: "memory" } },
  } as unknown as ICacheModuleConfig;
  const manager = new CacheManager(config);
  const service = new CacheService(manager, emitter);
  return { service };
}

// ════════════════════════════════════════════════════════════════════════════════
// Specs
// ════════════════════════════════════════════════════════════════════════════════

describe("CacheService event emission", () => {
  let emitter: ReturnType<typeof createRecordingEmitter>;
  let service: CacheService;

  beforeEach(() => {
    emitter = createRecordingEmitter();
    ({ service } = makeService(emitter));
  });

  describe("read events", () => {
    it("emits HIT when a key is found", async () => {
      await service.set("present", "value");
      emitter.reset();
      await service.get("present");
      expect(emitter.events).toEqual([
        { event: CACHE_EVENTS.HIT, payload: { key: "present", store: "memory" } },
      ]);
    });

    it("emits MISS when a key is absent", async () => {
      await service.get("absent");
      expect(emitter.events).toContainEqual({
        event: CACHE_EVENTS.MISS,
        payload: { key: "absent", store: "memory" },
      });
    });
  });

  describe("write events", () => {
    it("emits WRITTEN on set with the ttl in the payload", async () => {
      await service.set("k", "v", 60);
      expect(emitter.events).toContainEqual({
        event: CACHE_EVENTS.WRITTEN,
        payload: { key: "k", store: "memory", ttl: 60 },
      });
    });

    it("emits WRITTEN on forever with ttl=undefined", async () => {
      await service.forever("forever-key", "v");
      expect(emitter.events).toContainEqual({
        event: CACHE_EVENTS.WRITTEN,
        payload: { key: "forever-key", store: "memory", ttl: undefined },
      });
    });

    it("emits one WRITTEN per entry on setMany", async () => {
      await service.setMany(
        new Map([
          ["a", 1],
          ["b", 2],
        ]),
        30,
      );
      const written = emitter.events.filter((e) => e.event === CACHE_EVENTS.WRITTEN);
      expect(written).toHaveLength(2);
    });

    it("emits WRITTEN on add() when the key is new", async () => {
      const stored = await service.add("new", "value", 60);
      expect(stored).toBe(true);
      expect(emitter.events).toContainEqual({
        event: CACHE_EVENTS.WRITTEN,
        payload: { key: "new", store: "memory", ttl: 60 },
      });
    });

    it("does NOT emit WRITTEN on add() when the key already exists", async () => {
      await service.set("existing", "orig");
      emitter.reset();
      const stored = await service.add("existing", "attempt", 60);
      expect(stored).toBe(false);
      expect(emitter.events.filter((e) => e.event === CACHE_EVENTS.WRITTEN)).toHaveLength(0);
    });
  });

  describe("delete events", () => {
    it("emits FORGOTTEN on a successful delete", async () => {
      await service.set("to-remove", "v");
      emitter.reset();
      const removed = await service.delete("to-remove");
      expect(removed).toBe(true);
      expect(emitter.events).toContainEqual({
        event: CACHE_EVENTS.FORGOTTEN,
        payload: { key: "to-remove", store: "memory" },
      });
    });

    it("does NOT emit FORGOTTEN when the key was already absent", async () => {
      const removed = await service.delete("never-set");
      expect(removed).toBe(false);
      expect(emitter.events.filter((e) => e.event === CACHE_EVENTS.FORGOTTEN)).toHaveLength(0);
    });
  });

  describe("flush events", () => {
    it("emits FLUSHED on clear()", async () => {
      await service.clear();
      expect(emitter.events).toContainEqual({
        event: CACHE_EVENTS.FLUSHED,
        payload: { store: "memory" },
      });
    });
  });

  describe("counter events", () => {
    it("emits INCREMENTED with the new value", async () => {
      const next = await service.increment("counter", 3);
      expect(next).toBe(3);
      expect(emitter.events).toContainEqual({
        event: CACHE_EVENTS.INCREMENTED,
        payload: { key: "counter", store: "memory", by: 3, value: 3 },
      });
    });

    it("emits DECREMENTED with the new value", async () => {
      await service.set("counter", 10);
      emitter.reset();
      const next = await service.decrement("counter", 4);
      expect(next).toBe(6);
      expect(emitter.events).toContainEqual({
        event: CACHE_EVENTS.DECREMENTED,
        payload: { key: "counter", store: "memory", by: 4, value: 6 },
      });
    });
  });

  describe("touch events", () => {
    it("emits TOUCHED with success=true when the key existed", async () => {
      await service.set("touchable", "v", 60);
      emitter.reset();
      const updated = await service.touch("touchable", 120);
      expect(updated).toBe(true);
      expect(emitter.events).toContainEqual({
        event: CACHE_EVENTS.TOUCHED,
        payload: { key: "touchable", store: "memory", ttl: 120, success: true },
      });
    });

    it("emits TOUCHED with success=false when the key was absent", async () => {
      const updated = await service.touch("missing", 60);
      expect(updated).toBe(false);
      expect(emitter.events).toContainEqual({
        event: CACHE_EVENTS.TOUCHED,
        payload: { key: "missing", store: "memory", ttl: 60, success: false },
      });
    });
  });

  describe("remember / rememberForever", () => {
    it("emits MISS + WRITTEN on first call", async () => {
      const value = await service.remember("rk", 60, () => "computed");
      expect(value).toBe("computed");
      const names = emitter.events.map((e) => e.event);
      expect(names).toEqual([CACHE_EVENTS.MISS, CACHE_EVENTS.WRITTEN]);
    });

    it("emits HIT on subsequent call", async () => {
      await service.remember("rk", 60, () => "computed");
      emitter.reset();
      await service.remember("rk", 60, () => "should-not-run");
      const names = emitter.events.map((e) => e.event);
      expect(names).toEqual([CACHE_EVENTS.HIT]);
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Fail-soft when no emitter is injected
// ════════════════════════════════════════════════════════════════════════════════

describe("CacheService without an event emitter", () => {
  it("completes every operation without throwing", async () => {
    const { service } = makeService(undefined);
    await expect(service.set("k", "v", 60)).resolves.toBeUndefined();
    await expect(service.get("k")).resolves.toBe("v");
    await expect(service.delete("k")).resolves.toBe(true);
    await expect(service.clear()).resolves.toBeUndefined();
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Fail-soft when a listener throws
// ════════════════════════════════════════════════════════════════════════════════

describe("CacheService when the emitter throws", () => {
  it("still completes the cache operation", async () => {
    const throwingEmitter: IEventEmitter = {
      emit: () => {
        throw new Error("listener exploded");
      },
      on: () => () => {},
      eventNames: () => [],
      listenerCount: () => 0,
      removeAllListeners: () => {},
    };
    const { service } = makeService(throwingEmitter);
    await expect(service.set("k", "v", 60)).resolves.toBeUndefined();
    await expect(service.get("k")).resolves.toBe("v");
  });
});
