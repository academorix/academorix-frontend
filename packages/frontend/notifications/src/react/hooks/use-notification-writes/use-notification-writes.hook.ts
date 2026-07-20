/**
 * @file use-notification-writes.hook.ts
 * @module @stackra/notifications/react/hooks
 * @description Wrap the write endpoints — `markSeen`, `markAllSeen`,
 *   `remove`, `updatePreferences`.
 *
 *   Every callback is optimistic: it flips the local state (in-app
 *   centre + preferences service) first, then fires the network
 *   mutation through the caller-supplied {@link NotificationWriter}.
 *   Backend gaps (missing endpoints) are the writer's responsibility
 *   to swallow — the hook only distinguishes success + failure.
 *
 *   Consumers who don't need server-side persistence pass a noop
 *   writer (or don't call `updatePreferences` at all).
 */

import { useCallback, useState } from "react";
import { useInject } from "@stackra/container/react";

import { IN_APP_NOTIFICATION_CENTRE, NOTIFICATION_PREFERENCES_SERVICE } from "@/core/constants";
import type { InAppNotificationCentre, NotificationPreferencesService } from "@/core";
import type { INotificationPreferences } from "@/core/interfaces";
import type {
  IUseNotificationWritesResult,
  NotificationWriter,
} from "./use-notification-writes.interface";

/**
 * Callable writer bundle. Optimistically mutates local state
 * before firing the network call — a rejected writer surfaces via
 * the hook's `error` field but does NOT roll the local mutation
 * back (callers handle roll-back themselves if they need it).
 *
 * @example
 * ```tsx
 * import { useNotificationWrites } from '@stackra/notifications/react';
 *
 * function Row({ id, writer }) {
 *   const { markSeen } = useNotificationWrites(writer);
 *   return <button onClick={() => markSeen(id)}>Mark read</button>;
 * }
 * ```
 */
export function useNotificationWrites(
  writer?: Partial<NotificationWriter>,
): IUseNotificationWritesResult {
  const centre = useInject<InAppNotificationCentre>(IN_APP_NOTIFICATION_CENTRE);
  const preferences = useInject<NotificationPreferencesService>(NOTIFICATION_PREFERENCES_SERVICE);
  const [isPending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const runWithFlag = useCallback(async (task: () => Promise<void>): Promise<void> => {
    setPending(true);
    setError(null);
    try {
      await task();
    } catch (raw) {
      setError(raw instanceof Error ? raw : new Error(String(raw)));
    } finally {
      setPending(false);
    }
  }, []);

  const markSeen = useCallback(
    (id: string): Promise<void> =>
      runWithFlag(async () => {
        // Optimistic local flip so the badge count updates
        // immediately — the writer's failure never rolls it back.
        await centre.markSeen(id);
        if (writer?.markSeen) await writer.markSeen(id);
      }),
    [centre, writer, runWithFlag],
  );

  const markAllSeen = useCallback(
    (): Promise<void> =>
      runWithFlag(async () => {
        // Local mark-all-seen — the centre doesn't expose a bulk
        // method today, so iterate the current snapshot.
        for (const entry of centre.getSnapshot().items) {
          if (entry.seenAt == null) await centre.markSeen(entry.id);
        }
        if (writer?.markAllSeen) await writer.markAllSeen();
      }),
    [centre, writer, runWithFlag],
  );

  const remove = useCallback(
    (id: string): Promise<void> =>
      runWithFlag(async () => {
        await centre.dismiss(id);
        if (writer?.remove) await writer.remove(id);
      }),
    [centre, writer, runWithFlag],
  );

  const updatePreferences = useCallback(
    (next: INotificationPreferences): Promise<void> =>
      runWithFlag(async () => {
        preferences.set(next);
        if (writer?.updatePreferences) await writer.updatePreferences(next);
      }),
    [preferences, writer, runWithFlag],
  );

  return { markSeen, markAllSeen, remove, updatePreferences, isPending, error };
}
