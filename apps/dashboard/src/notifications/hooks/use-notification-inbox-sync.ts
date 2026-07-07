/**
 * @file use-notification-inbox-sync.ts
 * @module notifications/hooks/use-notification-inbox-sync
 *
 * @description
 * `useNotificationInboxSync()` — presence hook that hydrates the
 * in-memory inbox from `GET /api/v1/notifications` on mount and keeps
 * it live via a Reverb private-channel subscription. The syncer
 * produces no DOM — it exists purely to wire realtime + fetch into
 * the shared
 * {@link "@/notifications/provider/notifications-bundle".useNotifications}
 * context.
 *
 * ## Lifecycle
 *
 *   - **On identity resolve**: fetches page 1 of `/notifications` and
 *     seeds the context. A per-run fetch id guards against a stale
 *     resolve overwriting a fresher one when the user switches
 *     tenants.
 *   - **While mounted**: subscribes to the private channel
 *     `user.{userId}.notifications` via
 *     {@link "@academorix/realtime".usePrivateChannel} and listens for
 *     the `notifications.created` event (per NOTIFICATIONS_PLAN §4.6,
 *     with the private-channel adjustment agreed for Phase 1). Each
 *     event payload is a full {@link Notification} DTO which we hand
 *     to the context's `add()` — the context dedupes by `id`.
 *   - **On identity clear (logout)**: clears the context. The realtime
 *     hook itself handles unsubscribing when the channel name empties.
 *
 * ## Why `usePrivateChannel` (not raw `getEcho()`)
 *
 * The dashboard's shared Echo singleton lives in
 * `@/providers/live/echo`. Rather than mounting a second `laravel-echo`
 * instance, we wrap the singleton behind an adapter (see
 * `notifications/realtime/echo-realtime-client.ts`) that satisfies the
 * `RealtimeClient` interface `@academorix/realtime` expects — so both
 * Refine's live provider AND this hook share a single WebSocket.
 *
 * ## Backend endpoints
 *
 *   - `GET /api/v1/notifications` — exists (read-only, fixture-first).
 *     Returns a Foundation envelope with `data: Notification[]` and
 *     paginated `meta`. We ignore the pagination for now — the
 *     drawer's "load more" flow lands with the Refine `useInfiniteQuery`
 *     migration.
 */

import { usePrivateChannel } from "@academorix/realtime";
import { useGetIdentity } from "@refinedev/core";
import { useCallback, useEffect, useMemo, useRef } from "react";

import type { Identity } from "@/types";
import type { Notification } from "@academorix/notifications";
import type { ChannelHandlers } from "@academorix/realtime";

import {
  NOTIFICATION_ENDPOINTS,
  NOTIFICATION_REVERB_EVENT,
  buildUserNotificationsChannelName,
} from "@/config/notifications.config";
import { httpClient } from "@/lib/http";
import { unwrapEnvelope } from "@/lib/http/envelope";
import { useNotifications } from "@/notifications/provider/notifications-bundle";
import { echoRealtimeClient } from "@/notifications/realtime";

/**
 * Options accepted by {@link useNotificationInboxSync}. Kept as an
 * object for forward-compat — the initial-page-size, event name, and
 * channel-name-builder may all move here as parameters when we ship
 * the "one-off admin inbox" surface in a later phase.
 */
export interface UseNotificationInboxSyncOptions {
  /**
   * Overrides the default `GET /api/v1/notifications` endpoint. Kept
   * typed as a plain string so tests can inject a fixture URL without
   * mocking the whole config module.
   */
  readonly listEndpoint?: string;

  /**
   * Reverb event name emitted by the Communication module when a
   * notification row lands. Matches
   * {@link "@/config/notifications.config".NOTIFICATION_REVERB_EVENT}.
   */
  readonly eventName?: string;

  /**
   * Builds the Reverb private-channel name from a user id. Per the
   * plan, the tenant-user pairing is encoded on the backend side —
   * the frontend only knows the user id.
   */
  readonly channelName?: (userId: string) => string;
}

/**
 * Hydrates + subscribes the app-wide notifications context to the
 * backend.
 *
 * @remarks
 * Called exactly once from
 * {@link "@/notifications/provider/notifications-root".NotificationsRoot}.
 * Mounting it more than once produces duplicate subscriptions — the
 * hook does NOT guard against that at the moment because our
 * provider tree mounts it in one place only.
 */
export function useNotificationInboxSync(options: UseNotificationInboxSyncOptions = {}): void {
  const {
    listEndpoint = NOTIFICATION_ENDPOINTS.list,
    eventName = NOTIFICATION_REVERB_EVENT,
    channelName = buildUserNotificationsChannelName,
  } = options;

  const { data: identity } = useGetIdentity<Identity>();
  const { add, clear } = useNotifications();

  // Tracks the identity we last hydrated for. Used both to detect
  // logouts (identity → undefined) and tenant switches (id changes).
  const lastHydratedUserId = useRef<string | null>(null);

  // A monotonically-increasing token that guards the async fetch
  // effect against a stale response overwriting a fresher one after
  // a tenant switch.
  const fetchToken = useRef(0);

  // Callback stored in a ref so `handlers` below can stay
  // referentially stable across renders — the realtime hook only
  // rebinds when the channel name changes, so a fresh handler on
  // every render would silently drop realtime events.
  const addRef = useRef(add);

  addRef.current = add;

  // ---- Initial hydration ------------------------------------------
  //
  // We intentionally seed the context by REPLAYING each row through
  // `add()` rather than reaching for a `setAll()`-style API. The
  // context factory guarantees `add` deduplicates by id, so a race
  // with the first realtime broadcast is harmless.
  useEffect(() => {
    if (!identity?.id) {
      if (lastHydratedUserId.current !== null) {
        clear();
        lastHydratedUserId.current = null;
      }

      return;
    }

    if (lastHydratedUserId.current === identity.id) {
      return;
    }

    const userId = identity.id;
    const runId = ++fetchToken.current;

    lastHydratedUserId.current = userId;

    void (async (): Promise<void> => {
      try {
        const body = await httpClient.get<unknown>(listEndpoint);
        const list = unwrapEnvelope<Notification[]>(body);

        // Stale response — user switched tenants before this settled.
        if (fetchToken.current !== runId) {
          return;
        }

        // Sort newest-first so the drawer opens in the "just now"
        // order; the context prepends via `add`, so we iterate the
        // list in reverse to end up with newest-first after the fold.
        const iterable = Array.isArray(list) ? [...list].reverse() : [];

        for (const notification of iterable) {
          add(notification);
        }
      } catch {
        // Fetch failure — the drawer stays empty. The service worker
        // + realtime channel will still populate it as events arrive.
        // No toast: an "inbox failed to load" banner would compete
        // with the surface it's inside.
      }
    })();
  }, [identity, add, clear, listEndpoint]);

  // ---- Realtime subscription --------------------------------------
  //
  // Building the channel name here (rather than inside the hook)
  // gives us a stable empty-string when the identity hasn't resolved
  // yet — `usePrivateChannel` treats an empty name as "skip
  // subscription", which is exactly what we want for logged-out users.
  const resolvedChannel = identity?.id ? channelName(identity.id) : "";

  // Realtime payload handler. Ref-cell forwarding keeps the object
  // identity stable across renders (see comment above); the actual
  // callback stays fresh via `addRef.current`.
  const handleCreated = useCallback((payload: unknown): void => {
    // A malformed payload is a data-integrity bug on the backend;
    // silently dropping it in dev is more useful than adding a
    // runtime cost (like zod) that every consumer pays.
    if (!payload || typeof payload !== "object") {
      return;
    }

    // The backend broadcast wraps the DTO in either
    // `{ notification: {...} }` or emits the DTO directly. Accept
    // both shapes so we survive a broadcaster refactor.
    const record = payload as Record<string, unknown>;
    const dto = (record.notification as Notification | undefined) ?? (payload as Notification);

    if (!dto?.id) {
      return;
    }

    addRef.current(dto);
  }, []);

  const handlers = useMemo<ChannelHandlers>(
    () => ({ [eventName]: handleCreated }),
    [eventName, handleCreated],
  );

  usePrivateChannel(echoRealtimeClient, resolvedChannel, handlers);
}
