/**
 * @file use-notification-inbox-sync.test.ts
 * @module notifications/hooks/__tests__/use-notification-inbox-sync.test
 *
 * @description
 * Verifies the initial-fetch + realtime-subscribe wiring for the
 * inbox sync hook. The hook is presence-only (renders no DOM) so the
 * suite exercises it through a lightweight probe component that
 * mounts the hook plus a `useNotifications()` observer.
 *
 * Two behaviours matter:
 *
 *   1. On identity resolve, the initial `GET /notifications` is
 *      dispatched and its payload lands in the shared context.
 *   2. When a `notifications.created` event fires on the private
 *      channel, the payload gets `add()`ed to the context.
 *
 * Neither behaviour touches real Echo or a real HTTP layer — both
 * dependencies are mocked module-wide.
 */

import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Notification } from "@academorix/notifications";
import type { PropsWithChildren, ReactElement } from "react";

// ─────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────

/** Track calls made through the mocked httpClient. */
const httpClientGet = vi.fn();

vi.mock("@/lib/http", () => ({
  httpClient: {
    get: (path: string) => httpClientGet(path),
  },
}));

/** Fake Echo channel we hand back from `.private(...)`. */
type Listener = (payload: unknown) => void;

const listeners = new Map<string, Listener>();

const fakePrivateChannel = {
  listen: vi.fn((event: string, callback: Listener) => {
    listeners.set(event, callback);

    return fakePrivateChannel;
  }),
  stopListening: vi.fn(),
};

const fakeEcho = {
  private: vi.fn(() => fakePrivateChannel),
  leave: vi.fn(),
};

vi.mock("@/providers/live/echo", () => ({
  getEcho: () => Promise.resolve(fakeEcho),
  disconnectEcho: vi.fn(),
}));

/**
 * Fake identity — resolved synchronously so the effect fires on
 * mount.
 */
const useGetIdentityMock = vi.fn<() => { data: { id: string } | undefined }>(() => ({
  data: { id: "user-42" },
}));

vi.mock("@refinedev/core", () => ({
  useGetIdentity: () => useGetIdentityMock(),
}));

// ─────────────────────────────────────────────────────────────────────
// Imports AFTER the mocks so they capture the stubs above.
// ─────────────────────────────────────────────────────────────────────

import { useNotificationInboxSync } from "@/notifications/hooks/use-notification-inbox-sync";
import {
  notificationsBundle,
  useNotifications,
} from "@/notifications/provider/notifications-bundle";

// ─────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────

/** Builds a well-formed backend DTO with sensible defaults. */
function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: "notif_test_1",
    tenant_id: "tenant-1",
    user_id: "user-42",
    template_id: null,
    type: "payment_due",
    channel: "push",
    title: "Payment due",
    body_preview: "Invoice INV-0001 is due in 3 days.",
    data_ref: {},
    status: "delivered",
    sent_at: "2026-01-15T10:00:00Z",
    read_at: null,
    failure_reason: null,
    notes: null,
    created_at: "2026-01-15T10:00:00Z",
    updated_at: "2026-01-15T10:00:00Z",
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Wrappers
// ─────────────────────────────────────────────────────────────────────

/** Wraps a hook renderer in the app-wide notifications provider. */
function withProvider({ children }: PropsWithChildren): ReactElement {
  const { NotificationsProvider } = notificationsBundle;

  return <NotificationsProvider>{children}</NotificationsProvider>;
}

// ─────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  httpClientGet.mockReset();
  listeners.clear();
  fakeEcho.private.mockClear();
  fakeEcho.leave.mockClear();
  fakePrivateChannel.listen.mockClear();
  useGetIdentityMock.mockClear();
  useGetIdentityMock.mockReturnValue({ data: { id: "user-42" } });
});

describe("useNotificationInboxSync", () => {
  it("hydrates the context from GET /notifications on mount", async () => {
    const initial = makeNotification({ id: "notif_seed" });

    httpClientGet.mockResolvedValueOnce({ data: [initial] });

    const { result } = renderHook(
      () => {
        useNotificationInboxSync();

        return useNotifications();
      },
      { wrapper: withProvider },
    );

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(1);
    });

    expect(httpClientGet).toHaveBeenCalledWith("/notifications");
    expect(result.current.notifications[0]?.id).toBe("notif_seed");
  });

  it("subscribes to the private user channel + adds realtime arrivals", async () => {
    httpClientGet.mockResolvedValueOnce({ data: [] });

    const { result } = renderHook(
      () => {
        useNotificationInboxSync();

        return useNotifications();
      },
      { wrapper: withProvider },
    );

    // Wait for the Echo listener to attach.
    await waitFor(() => {
      expect(fakePrivateChannel.listen).toHaveBeenCalledWith(
        "notifications.created",
        expect.any(Function),
      );
    });

    // Verify the channel name was derived from the identity's id.
    expect(fakeEcho.private).toHaveBeenCalledWith("user.user-42.notifications");

    // Fire a broadcast — the hook should push it into the context.
    const arrival = makeNotification({ id: "notif_live" });
    const dispatch = listeners.get("notifications.created");

    dispatch?.(arrival);

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(1);
    });

    expect(result.current.notifications[0]?.id).toBe("notif_live");
  });

  it("accepts a wrapped `{ notification: {...} }` payload shape", async () => {
    httpClientGet.mockResolvedValueOnce({ data: [] });

    const { result } = renderHook(
      () => {
        useNotificationInboxSync();

        return useNotifications();
      },
      { wrapper: withProvider },
    );

    await waitFor(() => {
      expect(fakePrivateChannel.listen).toHaveBeenCalled();
    });

    const arrival = makeNotification({ id: "notif_wrapped" });
    const dispatch = listeners.get("notifications.created");

    dispatch?.({ notification: arrival });

    await waitFor(() => {
      expect(result.current.notifications.some((n) => n.id === "notif_wrapped")).toBe(true);
    });
  });

  it("clears the context when the identity resolves to nothing (logout)", async () => {
    httpClientGet.mockResolvedValueOnce({
      data: [makeNotification({ id: "notif_before_logout" })],
    });

    const { result, rerender } = renderHook(
      () => {
        useNotificationInboxSync();

        return useNotifications();
      },
      { wrapper: withProvider },
    );

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(1);
    });

    useGetIdentityMock.mockReturnValue({ data: undefined });
    rerender();

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(0);
    });
  });
});
