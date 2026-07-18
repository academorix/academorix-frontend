/**
 * @file use-dashboards.ts
 * @module modules/dashboard/dashboards/use-dashboards
 *
 * @description
 * `list` accessor for the dashboard registry. Reads every dashboard
 * the current user can see (two built-ins + their persisted custom
 * dashboards), keeps the local cache in sync with `storage` events
 * across tabs, and exposes typed mutators bound to the adapter.
 *
 * The hook stays intentionally thin — it's a bridge from the storage
 * adapter to React state, not a caching layer. When we swap the
 * playground's localStorage backend for the real API, callers keep
 * using the same hook signature.
 *
 * The hook exposes three feature surfaces in a single return value:
 *
 *   * **Dashboards** — the list + CRUD/duplicate/pin/default mutators
 *     tied to the storage adapter.
 *   * **Share grants** — role-based in-app access grants surfaced on
 *     top of the dashboard list. A tenant-wide `shareGrants`
 *     snapshot lets `canAccessDashboard` filter by dashboard id
 *     without a per-dashboard fetch.
 *   * **Version snapshots + widget annotations** — history and
 *     comments surfaces the customise panel and canvas consume.
 *     Annotations are exposed as a tenant-wide `annotations`
 *     snapshot fanned out across every dashboard so the widget-
 *     level comment count is a one-shot filter rather than a
 *     per-widget round trip.
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import { dashboardStorage } from "@/modules/dashboard/dashboards/storage";

import type {
  BroadcastTemplate,
  BroadcastViewLogRecord,
  BulkRevokeFilters,
  BulkRevokeResult,
  CreateBroadcastTemplateInput,
  CreateDashboardInput,
  CreateShareGrantInput,
  Dashboard,
  DashboardShareGrant,
  DashboardVersionSnapshot,
  IssueEmbedTokenInput,
  IssuedEmbedToken,
  UpdateDashboardInput,
  WidgetAnnotation,
} from "@/modules/dashboard/dashboards/types";

/**
 * Handle returned by {@link useDashboards}. Every mutator refreshes
 * the cached list on completion so callers never see stale data.
 */
export interface UseDashboardsResult {
  /** Every dashboard the user can currently see (built-in first, then custom). */
  dashboards: readonly Dashboard[];
  /**
   * True until the first list read completes. Consumers can render a
   * skeleton until this flips false.
   */
  isLoading: boolean;
  /**
   * True when a mutation is currently in flight. Useful for
   * disabling the Save button in edit forms.
   */
  isMutating: boolean;
  /** Any error thrown by the last operation — reset by the next call. */
  error: Error | null;
  /** Trigger a manual refresh (rarely needed; kept for edge cases). */
  refresh: () => Promise<void>;
  create: (input: CreateDashboardInput) => Promise<Dashboard>;
  update: (id: string, input: UpdateDashboardInput) => Promise<Dashboard>;
  remove: (id: string) => Promise<void>;
  duplicate: (id: string) => Promise<Dashboard>;
  togglePin: (id: string, next: boolean) => Promise<Dashboard>;
  setDefault: (id: string) => Promise<Dashboard>;
  issueEmbedToken: (id: string, input: IssueEmbedTokenInput) => Promise<IssuedEmbedToken>;
  revokeEmbedToken: (id: string, tokenId: string) => Promise<void>;
  /**
   * Rotate a broadcast token — mint a fresh {@link IssuedEmbedToken}
   * inheriting the source's config and mark the source with a
   * grace window so in-flight viewers don't 404 mid-slideshow.
   * See {@link DashboardStorageAdapter.rotateEmbedToken}.
   */
  rotateEmbedToken: (
    dashboardId: string,
    tokenId: string,
    graceSeconds: number,
  ) => Promise<IssuedEmbedToken>;
  /**
   * Enumerate the audit-log rows tied to a single broadcast token.
   * Rendered by the share dialog's Activity section. The
   * playground stub returns an empty array — the localStorage
   * adapter does not maintain an audit trail.
   */
  listBroadcastViewLog: (embedTokenId: string) => Promise<readonly BroadcastViewLogRecord[]>;
  /**
   * Tenant-wide snapshot of every broadcast template the current
   * user can pick from (private-to-them + tenant-shared). Refreshed
   * on every mutation and on cross-tab `storage` events touching
   * the templates key.
   */
  broadcastTemplates: readonly BroadcastTemplate[];
  /**
   * Persist a new broadcast template. Fires through `runMutation`
   * so the tenant-wide snapshot re-reads after the write.
   */
  createBroadcastTemplate: (input: CreateBroadcastTemplateInput) => Promise<BroadcastTemplate>;
  /**
   * Delete a broadcast template. Idempotent — unknown ids resolve
   * without error and the snapshot re-reads.
   */
  deleteBroadcastTemplate: (id: string) => Promise<void>;
  /**
   * Preview how many tokens a bulk-revoke filter set would flip.
   * Fetched lazily so the modal only queries the storage layer
   * once the operator has filled in at least one field.
   */
  previewBulkRevoke: (filters: BulkRevokeFilters) => Promise<BulkRevokeResult>;
  /**
   * Apply a bulk revoke. Goes through `runMutation` so the
   * dashboard list re-reads after the write (the sidebar reflects
   * the newly revoked links via the token list).
   */
  bulkRevokeEmbedTokens: (filters: BulkRevokeFilters) => Promise<BulkRevokeResult>;
  /**
   * Snapshot of every access grant across every dashboard the user
   * can see. Kept in-memory alongside the dashboard list so
   * consumers (`canAccessDashboard`, share dialog) can read the
   * full grant surface from a single source. Grants for dashboards
   * the viewer can't see are still included — the caller filters
   * with the pure {@link canAccessDashboard} helper.
   */
  shareGrants: readonly DashboardShareGrant[];
  /** Enumerate the grants for a single dashboard. */
  listShareGrants: (dashboardId: string) => Promise<readonly DashboardShareGrant[]>;
  /** Persist a new access grant for the dashboard. */
  addShareGrant: (
    dashboardId: string,
    input: CreateShareGrantInput,
  ) => Promise<DashboardShareGrant>;
  /** Revoke a single grant by id. Idempotent — see the adapter. */
  removeShareGrant: (grantId: string) => Promise<void>;
  /**
   * Enumerate every persisted snapshot for a dashboard, most-recent
   * first. Straight passthrough to the adapter — no caching layer
   * so the version-history dialog always renders the freshest log.
   */
  listVersions: (dashboardId: string) => Promise<readonly DashboardVersionSnapshot[]>;
  /**
   * Restore a dashboard to a persisted snapshot. Goes through
   * `runMutation` so the mutating flag flips + the list re-reads
   * exactly like every other write.
   */
  restoreVersion: (dashboardId: string, versionId: string) => Promise<Dashboard>;
  /**
   * Tenant-wide snapshot of every widget annotation across every
   * dashboard the user can see. Kept in-memory alongside the
   * dashboard list so per-widget consumers (the sortable-widget
   * badge, the comment popover) filter by widget instance id
   * against a single source of truth rather than fetching per widget.
   *
   * Refreshed on every mutation and on cross-tab `storage` events
   * that touch the annotations key.
   */
  annotations: readonly WidgetAnnotation[];
  /**
   * Enumerate every annotation attached to a dashboard, oldest
   * first. Callers usually consume {@link annotations} instead and
   * filter locally — this method is here for the rare "fresh read"
   * case (e.g. deep-linking into a widget from a notification).
   */
  listAnnotations: (dashboardId: string) => Promise<readonly WidgetAnnotation[]>;
  /**
   * Append a new annotation to a widget. Body is trimmed by the
   * caller — the adapter persists whatever it receives.
   */
  addAnnotation: (
    dashboardId: string,
    widgetInstanceId: string,
    body: string,
  ) => Promise<WidgetAnnotation>;
  /**
   * Edit an existing annotation's body. Only the owner should call
   * this — the storage layer stubs the actor as `"You"` today; the
   * real backend will enforce authorisation server-side.
   */
  updateAnnotation: (annotationId: string, body: string) => Promise<WidgetAnnotation>;
  /** Remove an annotation. Idempotent — unknown ids resolve without error. */
  removeAnnotation: (annotationId: string) => Promise<void>;
}

/**
 * Cross-tab sync — a `storage` event fires when another tab updates
 * localStorage. We refresh the list so switching between tabs doesn't
 * leave the current tab looking at stale data.
 *
 * Every dashboard-adjacent key gets its own case so a peer tab
 * touching just the version log doesn't force a dashboard list
 * re-read (the reload effect runs the fan-out reads in parallel
 * anyway, but the intent is explicit here for future tuning).
 */
function isRelevantStorageEvent(event: StorageEvent): boolean {
  if (!event.key) {
    // A `null` key means storage was cleared entirely.
    return true;
  }

  return (
    event.key.startsWith("academorix.dashboards.") ||
    // Share grants live in a separate key but influence the sidebar
    // filter — re-read the list when a peer tab mutates the grant
    // store so the current tab picks up the new access surface.
    event.key === "academorix.dashboard-share-grants.v1" ||
    // Version snapshots and widget annotations both feed the
    // customise panel + widget badges. A peer tab's edit needs to
    // propagate for the "3 most recent snapshots" strip and the
    // comment-count badge to stay honest.
    event.key === "academorix.dashboard-versions.v1" ||
    event.key === "academorix.dashboard-annotations.v1" ||
    // Broadcast templates share the same cross-tab freshness
    // requirement — a peer tab saving a template should surface
    // in the "Start from template" picker without a manual reload.
    event.key === "academorix.broadcast-templates.v1"
  );
}

/**
 * Fan out `listShareGrants` across every dashboard the storage
 * adapter can see, then flatten to a single tenant-wide array.
 * Kept in this file (rather than inline on the adapter) so the
 * playground can move to a bulk `listGrants` API in one place when
 * the backend lands.
 */
async function readAllGrants(): Promise<DashboardShareGrant[]> {
  const dashboards = await dashboardStorage.list();
  const perDashboard = await Promise.all(
    dashboards.map((entry) => dashboardStorage.listShareGrants(entry.id)),
  );

  return perDashboard.flatMap((entries) => entries as DashboardShareGrant[]);
}

/**
 * Fan out `listAnnotations` across every dashboard. Same rationale
 * as {@link readAllGrants}: the storage contract exposes a
 * per-dashboard reader but the UI wants a tenant-wide snapshot
 * for O(1) count lookups by widget instance id.
 */
async function readAllAnnotations(): Promise<WidgetAnnotation[]> {
  const dashboards = await dashboardStorage.list();
  const perDashboard = await Promise.all(
    dashboards.map((entry) => dashboardStorage.listAnnotations(entry.id)),
  );

  return perDashboard.flatMap((entries) => entries as WidgetAnnotation[]);
}

export function useDashboards(): UseDashboardsResult {
  const [dashboards, setDashboards] = useState<readonly Dashboard[]>([]);
  const [shareGrants, setShareGrants] = useState<readonly DashboardShareGrant[]>([]);
  const [annotations, setAnnotations] = useState<readonly WidgetAnnotation[]>([]);
  const [broadcastTemplates, setBroadcastTemplates] = useState<readonly BroadcastTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      // Kick off every read in parallel — the dashboard list, the
      // grant list, and the annotation list have no dependency on
      // each other, so fetching them together keeps first-paint
      // latency flat regardless of how many surfaces the hook
      // exposes.
      const [list, grants, notes, templates] = await Promise.all([
        dashboardStorage.list(),
        // The grant list is per-dashboard on the adapter contract;
        // we fan out across every dashboard here so the cached
        // snapshot in `shareGrants` covers the whole surface.
        readAllGrants(),
        // Same rationale as `readAllGrants` — the widget-level
        // comment badge needs O(1) count access by widget instance
        // id, and doing that from a per-dashboard read would force
        // a fetch on every widget mount.
        readAllAnnotations(),
        // Templates are a flat tenant-wide list on the adapter,
        // so no fan-out is needed. Reading them alongside the
        // other stores keeps first-paint latency flat and lets
        // the share dialog's "Start from template" picker render
        // without an extra request when the dialog opens.
        dashboardStorage.listBroadcastTemplates(),
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
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Cross-tab / other-window sync — re-read the list any time the
  // dashboards key changes in another tab. `storage` events don't
  // fire in the writing tab; the mutator paths handle that side.
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
    (input: CreateDashboardInput) => runMutation(() => dashboardStorage.create(input)),
    [runMutation],
  );

  const update = useCallback(
    (id: string, input: UpdateDashboardInput) =>
      runMutation(() => dashboardStorage.update(id, input)),
    [runMutation],
  );

  const remove = useCallback(
    (id: string) => runMutation(() => dashboardStorage.remove(id)),
    [runMutation],
  );

  const duplicate = useCallback(
    (id: string) => runMutation(() => dashboardStorage.duplicate(id)),
    [runMutation],
  );

  const togglePin = useCallback(
    (id: string, next: boolean) => runMutation(() => dashboardStorage.togglePin(id, next)),
    [runMutation],
  );

  const setDefault = useCallback(
    (id: string) => runMutation(() => dashboardStorage.setDefault(id)),
    [runMutation],
  );

  const issueEmbedToken = useCallback(
    (id: string, input: IssueEmbedTokenInput) =>
      runMutation(() => dashboardStorage.issueEmbedToken(id, input)),
    [runMutation],
  );

  const revokeEmbedToken = useCallback(
    (id: string, tokenId: string) =>
      runMutation(() => dashboardStorage.revokeEmbedToken(id, tokenId)),
    [runMutation],
  );

  const rotateEmbedToken = useCallback(
    (dashboardId: string, tokenId: string, graceSeconds: number) =>
      runMutation(() => dashboardStorage.rotateEmbedToken(dashboardId, tokenId, graceSeconds)),
    [runMutation],
  );

  // The audit-log read is a straight passthrough — no mutation, no
  // caching. Every open of the Activity section re-reads so a
  // long-running dialog session picks up freshly-recorded events.
  const listBroadcastViewLog = useCallback(
    (embedTokenId: string) => dashboardStorage.listBroadcastViewLog(embedTokenId),
    [],
  );

  // -------------------------------------------------------------------------
  // Broadcast template mutators — mint / delete go through
  // `runMutation` so the cached `broadcastTemplates` snapshot
  // stays in sync with the underlying store after every write.
  // -------------------------------------------------------------------------

  const createBroadcastTemplate = useCallback(
    (input: CreateBroadcastTemplateInput) =>
      runMutation(() => dashboardStorage.createBroadcastTemplate(input)),
    [runMutation],
  );

  const deleteBroadcastTemplate = useCallback(
    (id: string) => runMutation(() => dashboardStorage.deleteBroadcastTemplate(id)),
    [runMutation],
  );

  // -------------------------------------------------------------------------
  // Bulk revoke — preview is a straight read (no mutation, no
  // list refresh) so the modal can query it aggressively as the
  // operator tweaks filters. `bulkRevoke` goes through the
  // mutation path so the token list re-reads after the apply.
  // -------------------------------------------------------------------------

  const previewBulkRevoke = useCallback(
    (filters: BulkRevokeFilters) => dashboardStorage.previewBulkRevoke(filters),
    [],
  );

  const bulkRevokeEmbedTokens = useCallback(
    (filters: BulkRevokeFilters) =>
      runMutation(() => dashboardStorage.bulkRevokeEmbedTokens(filters)),
    [runMutation],
  );

  // -------------------------------------------------------------------------
  // Share-grant mutators — thin adapter wrappers that go through
  // `runMutation` so the mutating flag flips + the list re-reads
  // exactly like every other write.
  // -------------------------------------------------------------------------

  const listShareGrants = useCallback(
    (dashboardId: string) => dashboardStorage.listShareGrants(dashboardId),
    [],
  );

  const addShareGrant = useCallback(
    (dashboardId: string, input: CreateShareGrantInput) =>
      runMutation(() => dashboardStorage.addShareGrant(dashboardId, input)),
    [runMutation],
  );

  const removeShareGrant = useCallback(
    (grantId: string) => runMutation(() => dashboardStorage.removeShareGrant(grantId)),
    [runMutation],
  );

  // -------------------------------------------------------------------------
  // Version-history surface (G1) — the history dialog reads
  // `listVersions` directly (not cached, so the log stays fresh
  // even after an out-of-band cascade), and `restoreVersion` goes
  // through `runMutation` so the dashboard list re-reads after the
  // snapshot is applied.
  // -------------------------------------------------------------------------

  const listVersions = useCallback(
    (dashboardId: string) => dashboardStorage.listVersions(dashboardId),
    [],
  );

  const restoreVersion = useCallback(
    (dashboardId: string, versionId: string) =>
      runMutation(() => dashboardStorage.restoreVersion(dashboardId, versionId)),
    [runMutation],
  );

  // -------------------------------------------------------------------------
  // Widget-annotation surface (G2) — mutators go through
  // `runMutation` so the tenant-wide `annotations` snapshot stays
  // in sync after every write.
  // -------------------------------------------------------------------------

  const listAnnotations = useCallback(
    (dashboardId: string) => dashboardStorage.listAnnotations(dashboardId),
    [],
  );

  const addAnnotation = useCallback(
    (dashboardId: string, widgetInstanceId: string, body: string) =>
      runMutation(() => dashboardStorage.addAnnotation(dashboardId, widgetInstanceId, body)),
    [runMutation],
  );

  const updateAnnotation = useCallback(
    (annotationId: string, body: string) =>
      runMutation(() => dashboardStorage.updateAnnotation(annotationId, body)),
    [runMutation],
  );

  const removeAnnotation = useCallback(
    (annotationId: string) => runMutation(() => dashboardStorage.removeAnnotation(annotationId)),
    [runMutation],
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
