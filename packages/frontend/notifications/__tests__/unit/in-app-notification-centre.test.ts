/**
 * @file in-app-notification-centre.test.ts
 * @module @stackra/notifications/__tests__/unit
 * @description Behavioural tests for {@link InAppNotificationCentre}.
 */

import { describe, expect, it } from "vitest";

import { InAppNotificationCentre } from "@/core";
import type { IStorage, IStorageManager } from "@stackra/contracts";
import { mockNotificationPayload } from "@/testing";

/** Build a tiny in-memory `IStorage`. */
function makeStorage(seedValue: unknown = undefined): IStorage {
  const map = new Map<string, unknown>();
  if (seedValue !== undefined) map.set("stackra:notifications:centre", seedValue);
  return {
    async get<T>(key: string): Promise<T | null> {
      return (map.get(key) as T | undefined) ?? null;
    },
    async set<T>(key: string, value: T): Promise<void> {
      map.set(key, value);
    },
    async delete(key: string): Promise<void> {
      map.delete(key);
    },
    async clear(): Promise<void> {
      map.clear();
    },
    async has(key: string): Promise<boolean> {
      return map.has(key);
    },
    async keys(): Promise<string[]> {
      return [...map.keys()];
    },
  };
}

/** Build an `IStorageManager` returning a single in-memory storage. */
function makeManager(storage: IStorage = makeStorage()): IStorageManager {
  return {
    instance: () => storage,
    hasInstance: () => true,
    extend: function (this: IStorageManager) {
      return this;
    },
    getDefaultInstance: () => "memory",
  };
}

describe("InAppNotificationCentre — memory-only", () => {
  it("runs without a storage manager (memory fallback)", async () => {
    const centre = new InAppNotificationCentre({});
    await centre.dispatch(mockNotificationPayload({ title: "Hello" }));
    expect(centre.getSnapshot().items).toHaveLength(1);
    expect(centre.getSnapshot().items[0]?.payload.title).toBe("Hello");
  });
});

describe("InAppNotificationCentre.dispatch", () => {
  it("persists new entries through the storage manager", async () => {
    const storage = makeStorage();
    const centre = new InAppNotificationCentre({}, makeManager(storage));
    await centre.dispatch(mockNotificationPayload({ title: "One" }));
    const persisted = (await storage.get<{ payload: { title: string } }[]>(
      "stackra:notifications:centre",
    )) as { payload: { title: string } }[] | null;
    expect(persisted).toHaveLength(1);
    expect(persisted?.[0]?.payload.title).toBe("One");
  });

  it("generates unique ids per dispatch", async () => {
    const centre = new InAppNotificationCentre({}, makeManager());
    const a = await centre.dispatch(mockNotificationPayload());
    const b = await centre.dispatch(mockNotificationPayload());
    expect(a.id).not.toBe(b.id);
  });

  it("enforces the maxItems ceiling", async () => {
    const centre = new InAppNotificationCentre({ centre: { maxItems: 2 } }, makeManager());
    await centre.dispatch(mockNotificationPayload({ title: "A" }));
    await centre.dispatch(mockNotificationPayload({ title: "B" }));
    await centre.dispatch(mockNotificationPayload({ title: "C" }));
    // Newest-first order: C, B (A evicted).
    expect(centre.getSnapshot().items.map((e) => e.payload.title)).toEqual(["C", "B"]);
  });

  it("notifies subscribers on every dispatch", async () => {
    const centre = new InAppNotificationCentre({}, makeManager());
    let fires = 0;
    centre.subscribe(() => {
      fires += 1;
    });
    await centre.dispatch(mockNotificationPayload());
    await centre.dispatch(mockNotificationPayload());
    expect(fires).toBe(2);
  });

  it("emits a referentially stable snapshot until state changes", async () => {
    const centre = new InAppNotificationCentre({}, makeManager());
    const s1 = centre.getSnapshot();
    expect(centre.getSnapshot()).toBe(s1);
    await centre.dispatch(mockNotificationPayload());
    const s2 = centre.getSnapshot();
    expect(s2).not.toBe(s1);
  });
});

describe("InAppNotificationCentre.markSeen", () => {
  it("drops the unread count when an entry is marked seen", async () => {
    const centre = new InAppNotificationCentre({}, makeManager());
    const entry = await centre.dispatch(mockNotificationPayload());
    expect(centre.getSnapshot().unreadCount).toBe(1);
    const ok = await centre.markSeen(entry.id);
    expect(ok).toBe(true);
    expect(centre.getSnapshot().unreadCount).toBe(0);
    expect(centre.getSnapshot().items[0]?.seenAt).not.toBeNull();
  });

  it("returns false for a missing / already-seen id", async () => {
    const centre = new InAppNotificationCentre({}, makeManager());
    const entry = await centre.dispatch(mockNotificationPayload());
    expect(await centre.markSeen("does-not-exist")).toBe(false);
    await centre.markSeen(entry.id);
    // Second call returns false because it's already seen.
    expect(await centre.markSeen(entry.id)).toBe(false);
  });
});

describe("InAppNotificationCentre.dismiss / clear", () => {
  it("removes a dismissed entry from the visible queue", async () => {
    const centre = new InAppNotificationCentre({}, makeManager());
    const entry = await centre.dispatch(mockNotificationPayload());
    expect(await centre.dismiss(entry.id)).toBe(true);
    expect(centre.getSnapshot().items).toHaveLength(0);
  });

  it("returns false for a missing id", async () => {
    const centre = new InAppNotificationCentre({}, makeManager());
    expect(await centre.dismiss("missing")).toBe(false);
  });

  it("clear() drops every entry", async () => {
    const centre = new InAppNotificationCentre({}, makeManager());
    await centre.dispatch(mockNotificationPayload());
    await centre.dispatch(mockNotificationPayload());
    await centre.clear();
    expect(centre.getSnapshot().items).toHaveLength(0);
  });
});

describe("InAppNotificationCentre — hydration", () => {
  it("rehydrates from storage on onModuleInit", async () => {
    const seed = [
      {
        id: "seeded",
        createdAt: 1,
        seenAt: null,
        dismissedAt: null,
        payload: { title: "Seeded" },
      },
    ];
    const storage = makeStorage(seed);
    const centre = new InAppNotificationCentre({}, makeManager(storage));
    await centre.onModuleInit();
    expect(centre.getSnapshot().items).toHaveLength(1);
    expect(centre.getSnapshot().items[0]?.payload.title).toBe("Seeded");
  });

  it("fail-soft when storage.get throws", async () => {
    const brokenStorage: IStorage = {
      async get(): Promise<null> {
        throw new Error("corrupt");
      },
      async set(): Promise<void> {},
      async delete(): Promise<void> {},
      async clear(): Promise<void> {},
      async has(): Promise<boolean> {
        return false;
      },
      async keys(): Promise<string[]> {
        return [];
      },
    };
    const centre = new InAppNotificationCentre({}, makeManager(brokenStorage));
    await centre.onModuleInit();
    // No throw; empty queue.
    expect(centre.getSnapshot().items).toEqual([]);
  });
});
