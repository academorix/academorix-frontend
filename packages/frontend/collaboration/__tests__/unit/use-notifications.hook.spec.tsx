// @vitest-environment jsdom
/**
 * @file use-notifications.hook.spec.tsx
 * @module @stackra/collaboration/__tests__/unit
 * @description Behavioural spec for `useNotifications` — the storage-
 *   backed collaboration notification hook.
 *
 *   Covers:
 *   - Initial hydration from `storage.get(STORAGE_KEY)`.
 *   - `addNotification(...)` shape (`id`, `read: false`, `createdAt`,
 *     newest-first order, 50-entry cap).
 *   - `markRead(id)` / `markAllRead()` flipping the `read` flag.
 *   - `unreadCount` counting unread entries.
 *   - Every state change mirrors to storage (fire-and-forget).
 *   - Fail-soft when `storage.get` rejects — the list stays empty,
 *     no throw escapes the hook.
 *
 *   The hook is mocked at the `@stackra/storage/react` boundary so a
 *   `MockStorage` instance stands in for the real `IStorage`. That
 *   keeps the test in-process and side-effect free.
 */

import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MockStorage } from "@stackra/storage/testing";

// ── Mock `@stackra/storage/react` ───────────────────────────────────────────
//
// The mock factory is hoisted above imports by vitest's transformer. It
// reads `state.storage` at call time — so the `beforeEach` swap is
// visible to every `renderHook` invocation.

const state = vi.hoisted(() => ({
  storage: null as MockStorage | null,
}));

vi.mock("@stackra/storage/react", () => ({
  useStorage: () => state.storage,
}));

// AFTER the mock — import the hook under test. Both this import and any
// transitive `import { useStorage } from '@stackra/storage/react'` will
// resolve through the mock above.
import { useNotifications } from "@/hooks/use-notifications/use-notifications.hook";
import type { CollaborationNotification } from "@/interfaces/notification.interface";

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Build a notification skeleton for `addNotification()` inputs. */
function notificationInput(
  overrides: Partial<Omit<CollaborationNotification, "id" | "read" | "createdAt">> = {},
): Omit<CollaborationNotification, "id" | "read" | "createdAt"> {
  return {
    type: overrides.type ?? "mention",
    roomId: overrides.roomId ?? "room-1",
    message: overrides.message ?? "Alice mentioned you",
    fromUserId: overrides.fromUserId ?? "user-alice",
    fromUserName: overrides.fromUserName ?? "Alice",
  };
}

/**
 * Build a full notification for pre-seeding storage. Fills in the
 * fields `addNotification()` would normally derive so the persisted
 * shape matches production.
 */
function persistedNotification(
  overrides: Partial<CollaborationNotification> = {},
): CollaborationNotification {
  return {
    id: overrides.id ?? "persisted-1",
    type: overrides.type ?? "mention",
    roomId: overrides.roomId ?? "room-1",
    message: overrides.message ?? "Persisted notification",
    fromUserId: overrides.fromUserId ?? "user-persisted",
    fromUserName: overrides.fromUserName ?? "Persisted User",
    read: overrides.read ?? false,
    createdAt: overrides.createdAt ?? Date.now(),
  };
}

// ── Spec ────────────────────────────────────────────────────────────────────

describe("useNotifications", () => {
  beforeEach(() => {
    // Fresh in-memory storage per test — no state bleeds between cases.
    state.storage = new MockStorage();
  });

  afterEach(() => {
    cleanup();
    state.storage = null;
  });

  // ── Hydration ────────────────────────────────────────────────────────────

  describe("hydration", () => {
    it("starts empty when nothing is persisted", async () => {
      const { result } = renderHook(() => useNotifications());
      // The hook always starts with `[]` — hydration runs in a
      // useEffect and is async. Assert the synchronous initial value.
      expect(result.current.notifications).toEqual([]);
      expect(result.current.unreadCount).toBe(0);
    });

    it("hydrates from storage when a persisted list exists", async () => {
      // Seed BEFORE mount so the hydration effect reads it.
      const persisted = [persistedNotification({ id: "a" }), persistedNotification({ id: "b" })];
      await state.storage!.set("collab:notifications", persisted);

      const { result } = renderHook(() => useNotifications());

      // The hydration `.then` fires on the microtask queue; drive
      // React to flush it and then assert.
      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(2);
      });
      expect(result.current.notifications[0]?.id).toBe("a");
      expect(result.current.notifications[1]?.id).toBe("b");
    });

    it("leaves the list empty when storage.get rejects (fail-soft)", async () => {
      // Swap in a rejecting `get` — the hook's `.catch` MUST swallow
      // the failure rather than surfacing it into React state.
      const rejecting = state.storage!;
      rejecting.get = vi.fn().mockRejectedValue(new Error("boom"));

      const { result } = renderHook(() => useNotifications());

      // Give the failed promise a tick to settle so we know the
      // fail-soft path executed.
      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.notifications).toEqual([]);
      expect(result.current.unreadCount).toBe(0);
    });
  });

  // ── addNotification ──────────────────────────────────────────────────────

  describe("addNotification", () => {
    it("prepends a new entry with a generated id, `read: false`, and `createdAt`", () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.addNotification(
          notificationInput({ message: "first", fromUserName: "Alice" }),
        );
      });

      expect(result.current.notifications).toHaveLength(1);
      const [n] = result.current.notifications;
      expect(n?.id).toEqual(expect.any(String));
      // `Str.uuid()` produces v4 UUIDs — assert the format so we don't
      // accidentally regress to the old `Math.random` id-gen.
      expect(n?.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(n?.read).toBe(false);
      expect(n?.createdAt).toEqual(expect.any(Number));
      expect(n?.message).toBe("first");
      expect(n?.fromUserName).toBe("Alice");
    });

    it("places newest entries at the head of the list", () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.addNotification(notificationInput({ message: "first" }));
      });
      act(() => {
        result.current.addNotification(notificationInput({ message: "second" }));
      });

      expect(result.current.notifications[0]?.message).toBe("second");
      expect(result.current.notifications[1]?.message).toBe("first");
    });

    it("caps the list at 50 entries", () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        // Add 60 — the cap should drop the oldest 10.
        for (let i = 0; i < 60; i += 1) {
          result.current.addNotification(notificationInput({ message: `msg-${i}` }));
        }
      });

      expect(result.current.notifications).toHaveLength(50);
      // Newest first — msg-59 leads.
      expect(result.current.notifications[0]?.message).toBe("msg-59");
      // Cap keeps the newest 50, so msg-10 is the oldest survivor.
      expect(result.current.notifications[49]?.message).toBe("msg-10");
    });
  });

  // ── markRead / markAllRead / unreadCount ────────────────────────────────

  describe("mark actions and unreadCount", () => {
    it("markRead(id) flips only the matching entry to read", () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.addNotification(notificationInput({ message: "a" }));
        result.current.addNotification(notificationInput({ message: "b" }));
      });
      const [, second] = result.current.notifications;
      const targetId = second!.id;

      act(() => {
        result.current.markRead(targetId);
      });

      const flipped = result.current.notifications.find((n) => n.id === targetId);
      expect(flipped?.read).toBe(true);
      // The other entry is still unread.
      const other = result.current.notifications.find((n) => n.id !== targetId);
      expect(other?.read).toBe(false);
    });

    it("markAllRead() flips every entry to read", () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.addNotification(notificationInput({ message: "a" }));
        result.current.addNotification(notificationInput({ message: "b" }));
        result.current.addNotification(notificationInput({ message: "c" }));
      });

      act(() => {
        result.current.markAllRead();
      });

      expect(result.current.notifications.every((n) => n.read)).toBe(true);
      expect(result.current.unreadCount).toBe(0);
    });

    it("unreadCount reflects the number of !read entries", () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.addNotification(notificationInput({ message: "a" }));
        result.current.addNotification(notificationInput({ message: "b" }));
        result.current.addNotification(notificationInput({ message: "c" }));
      });
      expect(result.current.unreadCount).toBe(3);

      const [, second] = result.current.notifications;
      act(() => {
        result.current.markRead(second!.id);
      });
      expect(result.current.unreadCount).toBe(2);
    });
  });

  // ── Storage mirroring ────────────────────────────────────────────────────

  describe("storage mirror", () => {
    it("writes the current list to storage on every state change", async () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.addNotification(notificationInput({ message: "first" }));
      });

      // The mirror effect fires on every commit — give the async
      // `set` a tick to settle before reading the map.
      await waitFor(async () => {
        const persisted =
          await state.storage!.get<CollaborationNotification[]>("collab:notifications");
        expect(persisted).toHaveLength(1);
        expect(persisted?.[0]?.message).toBe("first");
      });
    });

    it("mirrors markRead flips to storage", async () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.addNotification(notificationInput({ message: "flip-me" }));
      });
      const [entry] = result.current.notifications;

      act(() => {
        result.current.markRead(entry!.id);
      });

      await waitFor(async () => {
        const persisted =
          await state.storage!.get<CollaborationNotification[]>("collab:notifications");
        expect(persisted?.[0]?.read).toBe(true);
      });
    });
  });
});
