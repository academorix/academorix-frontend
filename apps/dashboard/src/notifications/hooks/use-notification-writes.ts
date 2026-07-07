/**
 * @file use-notification-writes.ts
 * @module notifications/hooks/use-notification-writes
 *
 * @description
 * `useNotificationWrites()` — thin, non-reactive wrapper around the
 * notification write endpoints (`markRead`, `markAllRead`, `remove`).
 * Every call fires the HTTP request, silently swallows a "backend
 * doesn't ship this yet" response (`404` or `501`) so the optimistic
 * local mutation the caller already applied stays intact, and
 * re-throws anything else so caller-level toasts / retry paths can
 * observe it.
 *
 * ## Why not `useMutation`?
 *
 * A Refine-flavoured `useMutation` would give us caching, retries,
 * and a per-row `isLoading` flag. It would also block the optimistic
 * flip on every row action — we want the inbox to feel *fast* even
 * before the backend confirms. The rows call `markRead(...)` on the
 * shared context first (optimistic UI); this hook then attempts
 * to persist the state server-side and yields quietly on failure.
 *
 * ## Which errors are "expected"
 *
 *   - `404 Not Found` — the endpoint has not been registered by the
 *     backend router yet (Phase 1 of the Communication module ships
 *     read routes only).
 *   - `501 Not Implemented` — the endpoint is registered but
 *     explicitly returns "not built yet". We treat this the same as
 *     404: log once at `debug`, keep the optimistic flip in place.
 *
 * Everything else propagates so the caller can react (e.g. rebroadcast
 * the mutation on network recovery via `httpClient`'s retry queue —
 * see `@/lib/http`).
 *
 * ## TODO(backend-endpoint) markers
 *
 * The three endpoints wrapped here (`markRead`, `markAllRead`,
 * `remove`) are backend gaps. Once they ship, the try/catch below
 * still degrades cleanly on transient failure — no code changes
 * required at the callsites.
 */

import { useCallback, useMemo } from "react";

import type { ApiError } from "@/lib/http/errors";

import { NOTIFICATION_ENDPOINTS, buildEndpointPath } from "@/config/notifications.config";
import { httpClient } from "@/lib/http";

/**
 * HTTP status codes we treat as "backend didn't ship this yet" and
 * therefore silently swallow.
 */
const BACKEND_GAP_STATUSES: ReadonlySet<number> = new Set<number>([404, 501]);

/**
 * `true` when `err` looks like a backend-gap response. Narrow enough
 * to avoid swallowing real bugs (e.g. a 403 authorisation issue).
 */
function isBackendGap(err: unknown): boolean {
  if (!err || typeof err !== "object") {
    return false;
  }

  const status = (err as { statusCode?: number }).statusCode;

  if (typeof status === "number" && BACKEND_GAP_STATUSES.has(status)) {
    return true;
  }

  const legacyStatus = (err as { status?: number }).status;

  if (typeof legacyStatus === "number" && BACKEND_GAP_STATUSES.has(legacyStatus)) {
    return true;
  }

  return false;
}

/**
 * Logs a backend-gap swallow at `debug`. Kept internal so we can
 * migrate to a structured logger later.
 */
function logBackendGap(operation: string, path: string, error: unknown): void {
  const status = (error as ApiError | undefined)?.statusCode ?? "unknown";

  // eslint-disable-next-line no-console
  console.debug(
    `[notifications] ${operation} — backend endpoint not shipped yet (status=${status}, path=${path}). ` +
      `Optimistic UI kept in place. Retry-later would be a no-op until the endpoint lands.`,
  );
}

/** Return shape of {@link useNotificationWrites}. */
export interface UseNotificationWritesResult {
  /**
   * Fires `POST /api/v1/notifications/{id}/read`. Resolves whether
   * the request succeeded, was swallowed as a backend gap, or bubbled
   * unexpectedly (in which case the promise rejects — see file
   * docblock).
   */
  readonly markRead: (id: string) => Promise<void>;
  /** Fires `POST /api/v1/notifications/read-all`. */
  readonly markAllRead: () => Promise<void>;
  /** Fires `DELETE /api/v1/notifications/{id}`. */
  readonly remove: (id: string) => Promise<void>;
}

/**
 * Returns memoised action callbacks that call the notification write
 * endpoints. See file docblock for graceful-failure semantics.
 */
export function useNotificationWrites(): UseNotificationWritesResult {
  const markRead = useCallback(async (id: string): Promise<void> => {
    // TODO(backend-endpoint): POST /api/v1/notifications/{id}/read —
    //   endpoint does NOT exist yet. See Communication module
    //   `routes/tenant.php`. Response should be 204 No Content on
    //   success. Idempotent per {id, user}.
    const path = buildEndpointPath(NOTIFICATION_ENDPOINTS.markRead, { id });

    try {
      await httpClient.post(path);
    } catch (err) {
      if (isBackendGap(err)) {
        logBackendGap("markRead", path, err);

        return;
      }

      throw err;
    }
  }, []);

  const markAllRead = useCallback(async (): Promise<void> => {
    // TODO(backend-endpoint): POST /api/v1/notifications/read-all —
    //   endpoint does NOT exist yet. Response 204 No Content on
    //   success. Idempotent per user.
    const path = NOTIFICATION_ENDPOINTS.markAllRead;

    try {
      await httpClient.post(path);
    } catch (err) {
      if (isBackendGap(err)) {
        logBackendGap("markAllRead", path, err);

        return;
      }

      throw err;
    }
  }, []);

  const remove = useCallback(async (id: string): Promise<void> => {
    // TODO(backend-endpoint): DELETE /api/v1/notifications/{id} —
    //   endpoint does NOT exist yet. Response 204 No Content on
    //   success.
    const path = buildEndpointPath(NOTIFICATION_ENDPOINTS.remove, { id });

    try {
      await httpClient.delete(path);
    } catch (err) {
      if (isBackendGap(err)) {
        logBackendGap("remove", path, err);

        return;
      }

      throw err;
    }
  }, []);

  return useMemo(() => ({ markRead, markAllRead, remove }), [markRead, markAllRead, remove]);
}
