/**
 * @file create-notifications-context.test.tsx
 * @module @academorix/notifications/context/__tests__/create-notifications-context.test
 *
 * @description
 * React Testing Library tests for the inbox provider.
 *
 * Covers:
 *
 *  - `add()` prepends notifications, newest first.
 *  - `add()` deduplicates by `id` (same id → replace).
 *  - `markRead(id)` sets `read_at` + `status: "read"`.
 *  - `markAllRead()` marks every unread; already-read entries stay
 *    untouched (their `read_at` doesn't drift forward).
 *  - `remove(id)` filters out.
 *  - `clear()` empties.
 *  - `unreadCount` is derived correctly.
 *  - `useNotifications()` throws when used outside `<NotificationsProvider>`.
 *  - The `initialNotifications` prop hydrates the state.
 */

import { act, render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createNotificationsContext } from "../create-notifications-context";

import type { Notification } from "../../types/notification.type";
import type { NotificationsContextValue } from "../create-notifications-context";
import type { ReactNode } from "react";

/** Builds a fully-shaped `Notification` with sensible defaults. */
function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: "notif_1",
    tenant_id: "tnt_1",
    user_id: "usr_1",
    template_id: null,
    type: "invitation_sent",
    channel: "push",
    title: "Invitation sent",
    body_preview: "Your invitation to Coach Alex is on the way",
    data_ref: {},
    status: "delivered",
    sent_at: "2025-01-15T09:00:00Z",
    read_at: null,
    failure_reason: null,
    notes: null,
    created_at: "2025-01-15T09:00:00Z",
    updated_at: "2025-01-15T09:00:00Z",
    ...overrides,
  };
}

describe("createNotificationsContext — hook contract", () => {
  it("returns the empty state when no initial list is passed", () => {
    const { NotificationsProvider, useNotifications } = createNotificationsContext();

    const wrapper = ({ children }: { children: ReactNode }): ReactNode => (
      <NotificationsProvider>{children}</NotificationsProvider>
    );

    const { result } = renderHook(() => useNotifications(), { wrapper });

    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });

  it("hydrates from initialNotifications", () => {
    const { NotificationsProvider, useNotifications } = createNotificationsContext();

    const initial = [
      makeNotification({ id: "notif_1" }),
      makeNotification({ id: "notif_2", read_at: "2025-01-15T10:00:00Z" }),
    ];

    const wrapper = ({ children }: { children: ReactNode }): ReactNode => (
      <NotificationsProvider initialNotifications={initial}>{children}</NotificationsProvider>
    );

    const { result } = renderHook(() => useNotifications(), { wrapper });

    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.unreadCount).toBe(1);
  });

  it("throws when useNotifications is called outside a provider", () => {
    const { useNotifications } = createNotificationsContext();

    // renderHook captures the thrown error on `result.error`.
    expect(() => renderHook(() => useNotifications())).toThrow(
      /useNotifications must be used within a <NotificationsProvider>/,
    );
  });
});

describe("createNotificationsContext — actions", () => {
  function setupHook(
    initial: readonly Notification[] = [],
  ): ReturnType<typeof renderHook<NotificationsContextValue, unknown>> {
    const { NotificationsProvider, useNotifications } = createNotificationsContext();

    const wrapper = ({ children }: { children: ReactNode }): ReactNode => (
      <NotificationsProvider initialNotifications={initial}>{children}</NotificationsProvider>
    );

    return renderHook(() => useNotifications(), { wrapper });
  }

  it("add() prepends a new notification (newest first)", () => {
    const { result } = setupHook([makeNotification({ id: "notif_1" })]);

    act(() => {
      result.current.add(makeNotification({ id: "notif_2", title: "New" }));
    });

    expect(result.current.notifications.map((n) => n.id)).toEqual(["notif_2", "notif_1"]);
    expect(result.current.unreadCount).toBe(2);
  });

  it("add() dedupes by id — same id replaces the existing entry", () => {
    const { result } = setupHook([makeNotification({ id: "notif_1", title: "Old title" })]);

    act(() => {
      result.current.add(makeNotification({ id: "notif_1", title: "New title" }));
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0]?.title).toBe("New title");
  });

  it("add() moves the deduped entry to the front", () => {
    const { result } = setupHook([
      makeNotification({ id: "notif_1" }),
      makeNotification({ id: "notif_2" }),
      makeNotification({ id: "notif_3" }),
    ]);

    act(() => {
      result.current.add(makeNotification({ id: "notif_3", title: "Now newest" }));
    });

    expect(result.current.notifications.map((n) => n.id)).toEqual([
      "notif_3",
      "notif_1",
      "notif_2",
    ]);
  });

  it("markRead(id) sets read_at + status to 'read'", () => {
    const { result } = setupHook([makeNotification({ id: "notif_1", status: "delivered" })]);

    act(() => {
      result.current.markRead("notif_1");
    });

    const entry = result.current.notifications[0];

    expect(entry?.read_at).toEqual(expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/));
    expect(entry?.status).toBe("read");
    expect(result.current.unreadCount).toBe(0);
  });

  it("markRead(id) is a no-op when the id is unknown", () => {
    const { result } = setupHook([makeNotification({ id: "notif_1" })]);

    act(() => {
      result.current.markRead("notif_ghost");
    });

    expect(result.current.notifications[0]?.read_at).toBeNull();
    expect(result.current.unreadCount).toBe(1);
  });

  it("markAllRead() marks every unread notification", () => {
    const { result } = setupHook([
      makeNotification({ id: "notif_1" }),
      makeNotification({ id: "notif_2" }),
      makeNotification({ id: "notif_3" }),
    ]);

    act(() => {
      result.current.markAllRead();
    });

    for (const entry of result.current.notifications) {
      expect(entry.read_at).toEqual(expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/));
      expect(entry.status).toBe("read");
    }

    expect(result.current.unreadCount).toBe(0);
  });

  it("markAllRead() leaves already-read entries untouched (read_at doesn't drift)", () => {
    const originalReadAt = "2025-01-01T00:00:00Z";
    const { result } = setupHook([
      makeNotification({ id: "notif_1", read_at: originalReadAt, status: "read" }),
      makeNotification({ id: "notif_2" }),
    ]);

    act(() => {
      result.current.markAllRead();
    });

    const readEntry = result.current.notifications.find((n) => n.id === "notif_1");
    const unreadEntry = result.current.notifications.find((n) => n.id === "notif_2");

    expect(readEntry?.read_at).toBe(originalReadAt);
    expect(unreadEntry?.read_at).not.toBeNull();
    expect(result.current.unreadCount).toBe(0);
  });

  it("remove(id) filters the notification out", () => {
    const { result } = setupHook([
      makeNotification({ id: "notif_1" }),
      makeNotification({ id: "notif_2" }),
    ]);

    act(() => {
      result.current.remove("notif_1");
    });

    expect(result.current.notifications.map((n) => n.id)).toEqual(["notif_2"]);
  });

  it("clear() empties the list", () => {
    const { result } = setupHook([
      makeNotification({ id: "notif_1" }),
      makeNotification({ id: "notif_2" }),
    ]);

    act(() => {
      result.current.clear();
    });

    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });
});

describe("createNotificationsContext — DOM integration", () => {
  it("renders unreadCount into a consumer component", () => {
    const { NotificationsProvider, useNotifications } = createNotificationsContext();

    function UnreadBadge(): ReactNode {
      const { unreadCount } = useNotifications();

      return <span data-testid="badge">{unreadCount}</span>;
    }

    render(
      <NotificationsProvider
        initialNotifications={[
          makeNotification({ id: "notif_1" }),
          makeNotification({ id: "notif_2", read_at: "2025-01-15T10:00:00Z" }),
        ]}
      >
        <UnreadBadge />
      </NotificationsProvider>,
    );

    expect(screen.getByTestId("badge")).toHaveTextContent("1");
  });
});
