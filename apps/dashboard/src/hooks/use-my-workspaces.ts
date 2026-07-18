/**
 * @file use-my-workspaces.ts
 * @module hooks/use-my-workspaces
 *
 * @description
 * `useMyWorkspaces()` — reads `GET /api/v1/me/workspaces` for the
 * workspace-switcher dropdown in the sidebar user pill.
 *
 * The hook memoises across mounts (module-level cache) so the
 * dropdown opens instantly on the second click. A `refresh()`
 * escape hatch is exposed for consumers that need to re-fetch (e.g.
 * after accepting a new invitation).
 */

import { useCallback, useEffect, useState } from "react";

import type { MyWorkspaceEntry } from "@/lib/api/auth-api";

import { ApiError } from "@/lib/api/http-client";
import { authApi } from "@/lib/api/auth-api";
import { isAuthenticated } from "@/refine/identity-store";

/** Module-level cache — one fetch per tab lifetime is the norm. */
let cache: readonly MyWorkspaceEntry[] | null = null;

/** Snapshot returned by the hook. */
export interface UseMyWorkspacesResult {
  workspaces: readonly MyWorkspaceEntry[];
  isLoading: boolean;
  error: { message: string; code: string } | null;
  refresh: () => Promise<void>;
}

export function useMyWorkspaces(): UseMyWorkspacesResult {
  const [workspaces, setWorkspaces] = useState<readonly MyWorkspaceEntry[]>(() => cache ?? []);
  const [isLoading, setLoading] = useState<boolean>(cache === null);
  const [error, setError] = useState<{ message: string; code: string } | null>(null);

  const load = useCallback(async (): Promise<void> => {
    if (!isAuthenticated()) {
      setWorkspaces([]);
      setLoading(false);

      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await authApi.myWorkspaces();

      cache = response.workspaces;
      setWorkspaces(response.workspaces);
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError({ message: caught.message, code: caught.code });
      } else {
        setError({
          message: "We couldn't load your workspaces.",
          code: "network_error",
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cache === null) void load();
  }, [load]);

  return { workspaces, isLoading, error, refresh: load };
}
