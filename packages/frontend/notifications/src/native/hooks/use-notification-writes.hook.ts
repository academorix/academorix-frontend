/**
 * @file use-notification-writes.hook.ts
 * @module @stackra/notifications/native/hooks
 * @description Native mirror of the web
 *   {@link useNotificationWrites} hook.
 *
 *   Identical implementation — pure DI, no DOM primitives. Kept
 *   under the native subpath for symmetry with the rest of
 *   `native/hooks/`.
 */

import { useCallback, useState } from 'react';
import { useInject } from '@stackra/container/react';

import { IN_APP_NOTIFICATION_CENTRE, NOTIFICATION_PREFERENCES_SERVICE } from '@/core/constants';
import type { InAppNotificationCentre, NotificationPreferencesService } from '@/core';
import type { INotificationPreferences } from '@/core/interfaces';

/**
 * Writer contract callers pass into {@link useNotificationWrites}.
 * Every method resolves to `void` and swallows transient backend
 * gaps so the caller's optimistic local mutation stays in place.
 */
export interface NotificationWriter {
  /** Persist "seen" state for a single entry. */
  readonly markSeen: (id: string) => Promise<void>;
  /** Persist "seen" state for every unread entry. */
  readonly markAllSeen: () => Promise<void>;
  /** Persist "dismissed" state — removes the entry from the queue. */
  readonly remove: (id: string) => Promise<void>;
  /** Persist a new preferences shape. */
  readonly updatePreferences: (preferences: INotificationPreferences) => Promise<void>;
}

/**
 * Value returned by the native
 * {@link useNotificationWrites} hook.
 */
export interface IUseNotificationWritesResult {
  /** Mark a single in-app entry as seen. */
  readonly markSeen: (id: string) => Promise<void>;
  /** Mark every in-app entry as seen. */
  readonly markAllSeen: () => Promise<void>;
  /** Remove (dismiss) a single in-app entry. */
  readonly remove: (id: string) => Promise<void>;
  /** Persist a preferences update. */
  readonly updatePreferences: (preferences: INotificationPreferences) => Promise<void>;
  /** Whether any write is currently in flight. */
  readonly isPending: boolean;
  /** Last error surfaced by a write (or `null`). */
  readonly error: Error | null;
}

/**
 * Native write-endpoints wrapper.
 *
 * @example
 * ```tsx
 * import { useNotificationWrites } from '@stackra/notifications/native';
 * ```
 */
export function useNotificationWrites(
  writer?: Partial<NotificationWriter>
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
        // immediately — writer failure never rolls it back.
        await centre.markSeen(id);
        if (writer?.markSeen) await writer.markSeen(id);
      }),
    [centre, writer, runWithFlag]
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
    [centre, writer, runWithFlag]
  );

  const remove = useCallback(
    (id: string): Promise<void> =>
      runWithFlag(async () => {
        await centre.dismiss(id);
        if (writer?.remove) await writer.remove(id);
      }),
    [centre, writer, runWithFlag]
  );

  const updatePreferences = useCallback(
    (next: INotificationPreferences): Promise<void> =>
      runWithFlag(async () => {
        preferences.set(next);
        if (writer?.updatePreferences) await writer.updatePreferences(next);
      }),
    [preferences, writer, runWithFlag]
  );

  return { markSeen, markAllSeen, remove, updatePreferences, isPending, error };
}
