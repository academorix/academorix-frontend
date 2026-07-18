/**
 * @file use-recent-activity.ts
 * @module hooks/use-recent-activity
 *
 * @description
 * `useRecentActivity()` — pulls the tenant activity feed from
 * `GET /api/v1/activities` for the dashboard widget.
 *
 * ## Dev / mock behaviour
 *
 * `authApi.recentActivity()` short-circuits in mock mode to the
 * dashboard fixture (`public/api/v1/dashboard.json` →
 * `recentActivity`) projected onto the backend `ActivityEntry`
 * shape, so this file no longer imports a compile-time fixture.
 *
 * The activity feed is sourced from `spatie/laravel-activitylog`
 * server-side (see the `Activity` module). Every domain module
 * writes its own semantic events via `activity()->log('…')`.
 */

import { useCallback, useEffect, useState } from "react";

import type { ActivityEntry } from "@/lib/api/auth-api";

import { ApiError } from "@/lib/api/http-client";
import { authApi } from "@/lib/api/auth-api";

/** Snapshot returned by the hook. */
export interface UseRecentActivityResult {
  /** Feed entries, empty array before first successful read. */
  entries: readonly ActivityEntry[];
  isLoading: boolean;
  error: { message: string; code: string } | null;
  refresh: () => Promise<void>;
}

export function useRecentActivity(perPage = 8): UseRecentActivityResult {
  const [entries, setEntries] = useState<readonly ActivityEntry[]>([]);
  const [isLoading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<{ message: string; code: string } | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await authApi.recentActivity(perPage);

      setEntries(response.data);
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError({ message: caught.message, code: caught.code });
      } else {
        setError({
          message: "We couldn't load the activity feed.",
          code: "network_error",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [perPage]);

  useEffect(() => {
    void load();
  }, [load]);

  return { entries, isLoading, error, refresh: load };
}
