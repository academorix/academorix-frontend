/**
 * @file use-dashboards.hook.ts
 * @module @stackra/dashboard/react/hooks/use-dashboards
 * @description Reactive access to the dashboard registry backed by an
 *   {@link IDashboardStorageAdapter}. Reads every dashboard, keeps the
 *   local cache in sync with `storage` events across tabs, and exposes
 *   typed mutators bound to the adapter.
 *
 *   The hook is intentionally thin — it's a bridge from the storage
 *   adapter to React state, not a caching layer. When we swap the
 *   playground's localStorage backend for the real API, callers keep
 *   using the same hook signature.
 *
 *   Three feature surfaces travel together:
 *
 *   1. **Dashboards** — the list + CRUD/duplicate/pin/default
 *      mutators.
 *   2. **Share grants** — a tenant-wide `shareGrants` snapshot for
 *      `canAccessDashboard` + the share dialog.
 *   3. **Version snapshots + widget annotations** — history and
 *      comments surfaces the customise panel + canvas consume.
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import type { IBroadcastTemplate } from "@/core/interfaces/broadcast-template.interface";
import type { IBulkRevokeFilters } from "@/core/interfaces/bulk-revoke-filters.interface";
import type { ICreateBroadcastTemplateInput } from "@/core/interfaces/create-broadcast-template-input.interface";
import type { ICreateDashboardInput } from "@/core/interfaces/create-dashboard-input.interface";
import type { ICreateShareGrantInput } from "@/core/interfaces/create-share-grant-input.interface";
import type { IDashboard } from "@/core/interfaces/dashboard.interface";
import type { IDashboardShareGrant } from "@/core/interfaces/dashboard-share-grant.interface";
import type { IDashboardStorageAdapter } from "@/core/interfaces/dashboard-storage-adapter.interface";
import type { IIssueEmbedTokenInput } from "@/core/interfaces/issue-embed-token-input.interface";
import type { IUpdateDashboardInput } from "@/core/interfaces/update-dashboard-input.interface";
import type { IWidgetAnnotation } from "@/core/interfaces/widget-annotation.interface";

import type { IUseDashboardsResult } from "./use-dashboards.interface";

/**
 * Cross-tab sync — a `storage` event fires when another tab updates
 * localStorage. Refresh the list so switching tabs doesn't leave the
 * current tab looking at stale data.
 *
 * Every dashboard-adjacent key is enumerated so peer-tab writes to
 * versions / annotations / templates propagate.
 */
function isRelevantStorageEvent(event: StorageEvent): boolean {
  if (!event.key) {
    // `null` key means storage was cleared entirely.
    return true;
  }

  return (
    event.key.startsWith("academorix.dashboards.") ||
    event.key === "academorix.dashboard-share-grants.v1" ||
    event.key === "academorix.dashboard-versions.v1" ||
    event.key === "academorix.dashboard-annotations.v1" ||
    event.key === "academorix.broadcast-templates.v1"
  );
}

/**
 * Fan out `listShareGrants` across every dashboard the storage
 * adapter can see, then flatten to a single tenant-wide array.
 * Kept in this file so a future backend swap (bulk `listGrants`
 * API) lands in one place.
 */
async function readAllGrants(storage: IDashboardStorageAdapter): Promise<IDashboardShareGrant[]> {
  const dashboards = await storage.list();
  const perDashboard = await Promise.all(
    dashboards.map((entry) => storage.listShareGrants(entry.id)),
  );

  return perDashboard.flatMap((entries) => entries as IDashboardShareGrant[]);
}

/**
 * Fan out `listAnnotations` across every dashboard. Same rationale
 * as {@link readAllGrants}: the storage contract exposes a
 * per-dashboard reader but the UI wants a tenant-wide snapshot for
 * O(1) count lookups by widget instance id.
 */
async function readAllAnnotations(storage: IDashboardStorageAdapter): Promise<IWidgetAnnotation[]> {
  const dashboards = await storage.list();
  const perDashboard = await Promise.all(
    dashboards.map((entry) => storage.listAnnotations(entry.id)),
  );

  return perDashboard.flatMap((entries) => entries as IWidgetAnnotation[]);
}

/**
 * Reactive dashboard registry hook.
 *
 * @param storage - Storage adapter driving reads + mutations.
 * @returns Reactive dashboard state + mutators.
 *
 * @example
 * ```typescript
 * import { useInject } from '@stackra/container/react';
 * import { DASHBOARD_STORAGE } from '@stackra/dashboard';
 * import { useDashboards } from '@stackra/dashboard/react';
 *
 * const storage = useInject(DASHBOARD_STORAGE);
 * const { dashboards, create } = useDashboards(storage);
 * ```
 */
export function useDashboards(storage: IDashboardStorageAdapter): IUseDashboardsResult {
  const [dashboards, setDashboards] = useState<readonly IDashboard[]>([]);
  const [shareGrants, setShareGrants] = useState<readonly IDashboardShareGrant[]>([]);
  const [annotations, setAnnotations] = useState<readonly IWidgetAnnotation[]>([]);
  const [broadcastTemplates, setBroadcastTemplates] = useState<readonly IBroadcastTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      // Kick off every read in parallel — the four snapshots have no
      // dependency on each other so fetching them together keeps
      // first-paint latency flat.
      const [list, grants, notes, templates] = await Promise.all([
        storage.list(),
        readAllGrants(storage),
        readAllAnnotations(storage),
        storage.listBroadcastTemplates(),
      ]);

      setDashboards(list);
      setShareGrants(grants);
      setAnnotations(notes);
      setBroadcastTemplates(templates);
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error(String(caught)));
    } finally {
      setIsLoading(false);
    }
  }, [storage]);

  useEffect(() => {
    void load();
  }, [load]);

  // Cross-tab / other-window sync — re-read the list when a relevant
  // storage key changes in another tab. `storage` events don't fire
  // in the writing tab; the mutator paths handle that side.
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handler = (event: StorageEvent): void => {
      if (isRelevantStorageEvent(event)) {
        void load();
      }
    };

    window.addEventListener("storage", handler);

    return () => window.removeEventListener("storage", handler);
  }, [load]);

  /**
   * Guarded mutator — wraps every adapter call with the mutating
   * flag, refreshes the list on success, and surfaces the error on
   * failure. Rethrows so callers can toast their own message.
   */
  const runMutation = useCallback(
    async <T>(operation: () => Promise<T>): Promise<T> => {
      setIsMutating(true);
      setError(null);
      try {
        const result = await operation();

        await load();

        return result;
      } catch (caught) {
        const err = caught instanceof Error ? caught : new Error(String(caught));

        setError(err);
        throw err;
      } finally {
        setIsMutating(false);
      }
    },
    [load],
  );

  const create = useCallback(
    (input: ICreateDashboardInput) => runMutation(() => storage.create(input)),
    [runMutation, storage],
  );

  const update = useCallback(
    (id: string, input: IUpdateDashboardInput) => runMutation(() => storage.update(id, input)),
    [runMutation, storage],
  );

  const remove = useCallback(
    (id: string) => runMutation(() => storage.remove(id)),
    [runMutation, storage],
  );

  const duplicate = useCallback(
    (id: string) => runMutation(() => storage.duplicate(id)),
    [runMutation, storage],
  );

  const togglePin = useCallback(
    (id: string, next: boolean) => runMutation(() => storage.togglePin(id, next)),
    [runMutation, storage],
  );

  const setDefault = useCallback(
    (id: string) => runMutation(() => storage.setDefault(id)),
    [runMutation, storage],
  );

  const issueEmbedToken = useCallback(
    (id: string, input: IIssueEmbedTokenInput) =>
      runMutation(() => storage.issueEmbedToken(id, input)),
    [runMutation, storage],
  );

  const revokeEmbedToken = useCallback(
    (id: string, tokenId: string) => runMutation(() => storage.revokeEmbedToken(id, tokenId)),
    [runMutation, storage],
  );

  const rotateEmbedToken = useCallback(
    (dashboardId: string, tokenId: string, graceSeconds: number) =>
      runMutation(() => storage.rotateEmbedToken(dashboardId, tokenId, graceSeconds)),
    [runMutation, storage],
  );

  // Straight passthrough — no mutation, no caching. Every open of
  // the Activity section re-reads.
  const listBroadcastViewLog = useCallback(
    (embedTokenId: string) => storage.listBroadcastViewLog(embedTokenId),
    [storage],
  );

  const createBroadcastTemplate = useCallback(
    (input: ICreateBroadcastTemplateInput) =>
      runMutation(() => storage.createBroadcastTemplate(input)),
    [runMutation, storage],
  );

  const deleteBroadcastTemplate = useCallback(
    (id: string) => runMutation(() => storage.deleteBroadcastTemplate(id)),
    [runMutation, storage],
  );

  const previewBulkRevoke = useCallback(
    (filters: IBulkRevokeFilters) => storage.previewBulkRevoke(filters),
    [storage],
  );

  const bulkRevokeEmbedTokens = useCallback(
    (filters: IBulkRevokeFilters) => runMutation(() => storage.bulkRevokeEmbedTokens(filters)),
    [runMutation, storage],
  );

  const listShareGrants = useCallback(
    (dashboardId: string) => storage.listShareGrants(dashboardId),
    [storage],
  );

  const addShareGrant = useCallback(
    (dashboardId: string, input: ICreateShareGrantInput) =>
      runMutation(() => storage.addShareGrant(dashboardId, input)),
    [runMutation, storage],
  );

  const removeShareGrant = useCallback(
    (grantId: string) => runMutation(() => storage.removeShareGrant(grantId)),
    [runMutation, storage],
  );

  const listVersions = useCallback(
    (dashboardId: string) => storage.listVersions(dashboardId),
    [storage],
  );

  const restoreVersion = useCallback(
    (dashboardId: string, versionId: string) =>
      runMutation(() => storage.restoreVersion(dashboardId, versionId)),
    [runMutation, storage],
  );

  const listAnnotations = useCallback(
    (dashboardId: string) => storage.listAnnotations(dashboardId),
    [storage],
  );

  const addAnnotation = useCallback(
    (dashboardId: string, widgetInstanceId: string, body: string) =>
      runMutation(() => storage.addAnnotation(dashboardId, widgetInstanceId, body)),
    [runMutation, storage],
  );

  const updateAnnotation = useCallback(
    (annotationId: string, body: string) =>
      runMutation(() => storage.updateAnnotation(annotationId, body)),
    [runMutation, storage],
  );

  const removeAnnotation = useCallback(
    (annotationId: string) => runMutation(() => storage.removeAnnotation(annotationId)),
    [runMutation, storage],
  );

  return useMemo(
    () => ({
      dashboards,
      isLoading,
      isMutating,
      error,
      refresh: load,
      create,
      update,
      remove,
      duplicate,
      togglePin,
      setDefault,
      issueEmbedToken,
      revokeEmbedToken,
      rotateEmbedToken,
      listBroadcastViewLog,
      broadcastTemplates,
      createBroadcastTemplate,
      deleteBroadcastTemplate,
      previewBulkRevoke,
      bulkRevokeEmbedTokens,
      shareGrants,
      listShareGrants,
      addShareGrant,
      removeShareGrant,
      listVersions,
      restoreVersion,
      annotations,
      listAnnotations,
      addAnnotation,
      updateAnnotation,
      removeAnnotation,
    }),
    [
      dashboards,
      isLoading,
      isMutating,
      error,
      load,
      create,
      update,
      remove,
      duplicate,
      togglePin,
      setDefault,
      issueEmbedToken,
      revokeEmbedToken,
      rotateEmbedToken,
      listBroadcastViewLog,
      broadcastTemplates,
      createBroadcastTemplate,
      deleteBroadcastTemplate,
      previewBulkRevoke,
      bulkRevokeEmbedTokens,
      shareGrants,
      listShareGrants,
      addShareGrant,
      removeShareGrant,
      listVersions,
      restoreVersion,
      annotations,
      listAnnotations,
      addAnnotation,
      updateAnnotation,
      removeAnnotation,
    ],
  );
}
