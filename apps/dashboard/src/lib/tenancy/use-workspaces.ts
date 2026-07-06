/**
 * @file use-workspaces.ts
 * @module lib/tenancy/use-workspaces
 *
 * @description
 * Fetches the list of tenants (workspaces) the current user belongs to. Used
 * on the Slack-style workspace picker (central host) and the "switch
 * workspace" dropdown inside the authenticated shell.
 *
 * Backend contract: {@code GET /api/v1/auth/workspaces} (a projection of the
 * caller's tenant memberships). Until that endpoint ships in every deploy
 * environment we fall back to {@code []} on 404 so the UI keeps working
 * during phased rollouts — the picker simply shows the "no workspaces" empty
 * state and the "Find my workspaces" recovery link stays available.
 */

import { useEffect, useState } from "react";

import type { WorkspaceListEntry } from "@/lib/tenancy/tenancy.types";

import { ApiError, httpClient } from "@/lib/http";

/** Return shape for {@link useMyWorkspaces}. */
export interface UseMyWorkspacesResult {
  /** The workspaces this user can sign in to. */
  workspaces: WorkspaceListEntry[];
  /** Whether the fetch is still in flight. */
  isLoading: boolean;
  /** The last fetch error, or {@code null}. */
  error: Error | null;
}

/** Response envelope for the workspaces endpoint. */
interface WorkspacesResponse {
  data: WorkspaceListEntry[];
}

/**
 * Fetches the current user's workspaces. Callable from anywhere; results are
 * per-component (no shared cache) — the picker only mounts once so cache
 * complexity is not worth the code.
 */
export function useMyWorkspaces(): UseMyWorkspacesResult {
  const [workspaces, setWorkspaces] = useState<WorkspaceListEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        let list: WorkspaceListEntry[] = [];

        try {
          const payload = await httpClient.get<WorkspacesResponse | WorkspaceListEntry[]>(
            "/v1/auth/workspaces",
          );

          list = Array.isArray(payload) ? payload : payload.data;
        } catch (caught) {
          // Endpoint not deployed yet: return an empty list, not an error,
          // so the picker renders its "no workspaces" empty state.
          if (caught instanceof ApiError && caught.statusCode === 404) {
            list = [];
          } else {
            throw caught;
          }
        }

        if (!cancelled) {
          setWorkspaces(list);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught : new Error("Failed to load workspaces."));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { workspaces, isLoading, error };
}
