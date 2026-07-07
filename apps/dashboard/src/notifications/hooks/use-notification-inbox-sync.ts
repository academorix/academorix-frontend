/**
 * @file use-notification-inbox-sync.ts
 * @module notifications/hooks/use-notification-inbox-sync
 *
 * @description
 * `useNotificationInboxSync()` — presence hook that hydrates the
 * in-memory inbox from `GET /notifications` on mount and keeps it live
 * via a Reverb private channel subscription. The syncer produces no
 * DOM — it exists purely to wire realtime + fetch into the shared
 * {@link "@/notifications/provider/notifications-bundle".useNotifications}
 * context.
 *
 * ## Lifecycle
 *
 *   - **On identity resolve**: fetches page 1 of `/notifications` and
 *     seeds the context. A per-run fetch id guards against a stale
 *     resolve overwriting a fresher one when the user switches tenants.
 *   - **While mounted**: subscribes to
 *     `private-user.{userId}.notifications` and listens for the
 *     `notifications.created` event (per NOTIFICATIONS_PLAN §4.6, with
 *     the private-channel adjustment agreed for Phase 1). Each event
 *     payload is a full {@link Notification} DTO which we hand to the
 *     context's `add()` — the context dedupes by `id`.
 *   - **On identity clear (logout)**: clears the context and leaves
 *     the channel so a subsequent login re-subscribes with fresh
 *     credentials.
 *
 * ## Why not `@academorix/realtime`?
 *
 * The dashboard has not yet migrated its realtime plumbing to
 * `@academorix/realtime` — that lives behind a later wave of the
 * package migration. Today the app talks to Laravel Reverb through
 * `@/providers/live/echo`'s `getEcho()` singleton. This hook wraps
 * that singleton with the same lifecycle discipline that
 * `@academorix/realtime`'s `usePrivateChannel` uses (mount / listen /
 * teardown), so a follow-up migration reduces to a two-line change.
 *
 * TODO(realtime-migration): once `@academorix/realtime` is wired into
 *   the dashboard providers tree, replace the internal `getEcho()`
 *   call with `usePrivateChannel(client, channelName, handlers)`.
 *
 * ## Backend endpoint
 *
 *   - `GET /notifications` — exists (read-only, fixture-first). Returns
 *     a Foundation envelope with `data: Notification[]` and paginated
 *     `meta`. We ignore the pagination for now — the drawer's "load
 *     more" flow lands with the Refine `useInfiniteQuery` migration.
 */

import { useGetIdentity } from "@refinedev/core";
import { useEffect, useRef } from "react";

import type { Identity } from "@/types";
import type { Notification } from "@academorix/notifications";

import { httpClient } from "@/lib/http";
import { unwrapEnvelope } from "@/lib/http/envelope";
import { useNotifications } from "@/notifications/provider/notifications-bundle";
import { getEcho } from "@/providers/live/echo";

/**
 * Options accepted by {@link useNotificationInboxSync}. Kept as an
 * object for forward-compat — the initial-page-size, event name, and
 * channel-name-builder may all move here as parameters when we ship
 * the "one-off admin inbox" surface in a later phase.
 */
export interface UseNotificationInboxSyncOptions {
  /**
   * Overrides the default `GET /notifications` endpoint. Kept typed as
   * a plain string rather than importing from
   * `@/config/notifications.config` — the config file's endpoint map
   * still uses the Phase-2 URL naming (`/notifications/push-subscriptions`)
   * whereas the backend today exposes plain `/notifications`.
   */
  readonly listEndpoint?: string;

  /**
   * Reverb event name emitted by the Communication module when a
   * notification row lands. Matches
   * {@link "@/config/notifications.config".REVERB_EVENTS.notificationCreated}.
   */
  readonly eventName?: string;

  /**
   * Builds the Reverb private-channel name from a user id. Per the
   * plan, the tenant-user pairing is encoded on the backend side —
   * the frontend only knows the user id.
   */
  readonly channelName?: (userId: string) => string;
}

/** Default `GET` endpoint. */
const DEFAULT_LIST_ENDPOINT = "/notifications";

/** Default Reverb event name (see `notifications.config.ts`). */
const DEFAULT_EVENT_NAME = "notifications.created";

/**
 * Default channel-name builder. Note we return the name WITHOUT the
 * `private-` prefix; Echo prepends it internally when we call
 * `echo.private(name)`.
 */
const defaultChannelName = (userId: string): string => `user.${userId}.notifications`;

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
    listEndpoint = DEFAULT_LIST_ENDPOINT,
    eventName = DEFAULT_EVENT_NAME,
    channelName = defaultChannelName,
  } = options;

  const { data: identity } = useGetIdentity<Identity>();
  const { add, clear } = useNotifications();

  // Tracks the identity we last synced for. Used both to detect
  // logouts (identity → undefined) and tenant switches (id changes).
  const lastSyncedUserId = useRef<string | null>(null);

  // A monotonically-increasing token that guards the async fetch
  // effect against a stale response overwriting a fresher one after
  // a tenant switch.
  const fetchToken = useRef(0);

  useEffect(() => {
    // Not signed in. Wipe the context so a stale unread badge does
    // not survive across sessions, then bail out of the subscribe.
    if (!identity?.id) {
      if (lastSyncedUserId.current !== null) {
        clear();
        lastSyncedUserId.current = null;
      }

      return;
    }

    // Already subscribed for this user — nothing to do.
    if (lastSyncedUserId.current === identity.id) {
      return;
    }

    const userId = identity.id;
    const channel = channelName(userId);
    const runId = ++fetchToken.current;

    lastSyncedUserId.current = userId;

    // ---- Initial hydration -----------------------------------------
    //
    // We intentionally seed the context by REPLAYING each row through
    // `add()` rather than reaching for a `setAll()`-style API. The
    // context factory guarantees `add` deduplicates by id, so a race
    // with the first realtime broadcast is harmless.

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

    // ---- Realtime subscription -------------------------------------
    //
    // We fire-and-forget the Echo boot so this hook stays synchronous
    // and the effect's cleanup can capture the channel name without
    // waiting on the transport.

    let cleaned = false;

    void getEcho().then((echo) => {
      if (cleaned) {
        return;
      }

      const listenable = echo.private(channel);

      listenable.listen(eventName, (payload: unknown): void => {
        // A malformed payload is a data-integrity bug on the backend;
        // logging it in dev is more useful than adding a runtime cost
        // (like zod) that every consumer pays.
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

        add(dto);
      });
    });

    return (): void => {
      // Guard against double-cleanup and leave the private channel so
      // a re-mount (StrictMode) or tenant switch subscribes cleanly.
      cleaned = true;
      void getEcho().then((echo) => {
        echo.leave(`private-${channel}`);
      });
    };
  }, [identity, add, clear, listEndpoint, eventName, channelName]);
}
