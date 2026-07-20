/**
 * @file dashboard-storage-adapter.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description Storage-adapter contract — the single seam between the
 *   dashboard framework's React hooks and the persistence layer.
 *
 *   Consumers implement this once and every hook + component in the
 *   framework works unchanged. The playground ships a localStorage
 *   implementation ({@link DashboardStorageService}); production apps
 *   swap in a Refine data-provider adapter.
 */

import type { IBroadcastTemplate } from "./broadcast-template.interface";
import type { IBroadcastViewLogRecord } from "./broadcast-view-log-record.interface";
import type { IBulkRevokeFilters } from "./bulk-revoke-filters.interface";
import type { IBulkRevokeResult } from "./bulk-revoke-result.interface";
import type { ICreateBroadcastTemplateInput } from "./create-broadcast-template-input.interface";
import type { ICreateDashboardInput } from "./create-dashboard-input.interface";
import type { ICreateShareGrantInput } from "./create-share-grant-input.interface";
import type { IDashboard } from "./dashboard.interface";
import type { IDashboardShareGrant } from "./dashboard-share-grant.interface";
import type { IDashboardVersionSnapshot } from "./dashboard-version-snapshot.interface";
import type { IEmbedTokenRecord } from "./embed-token-record.interface";
import type { IIssuedEmbedToken } from "./issued-embed-token.interface";
import type { IIssueEmbedTokenInput } from "./issue-embed-token-input.interface";
import type { IPublicEmbedDashboard } from "./public-embed-dashboard.interface";
import type { IUnlockedEmbedSession } from "./unlocked-embed-session.interface";
import type { IUnlockEmbedTokenInput } from "./unlock-embed-token-input.interface";
import type { IUpdateDashboardInput } from "./update-dashboard-input.interface";
import type { IWidgetAnnotation } from "./widget-annotation.interface";

/**
 * Storage-adapter contract. Every method returns a `Promise` so a
 * swap from a synchronous localStorage backend to an async HTTP
 * backend keeps consumer code identical.
 */
export interface IDashboardStorageAdapter {
  // ── Dashboard CRUD ─────────────────────────────────────────────

  /** Enumerate every dashboard the current user can see. */
  list: () => Promise<readonly IDashboard[]>;

  /** Fetch a single dashboard by id. Throws when unknown. */
  get: (id: string) => Promise<IDashboard>;

  /** Fetch a single dashboard by URL slug. Throws when unknown. */
  getBySlug: (slug: string) => Promise<IDashboard>;

  /** Persist a new dashboard. */
  create: (input: ICreateDashboardInput) => Promise<IDashboard>;

  /**
   * Update a dashboard. The `input.version` field enforces optimistic
   * locking — a mismatch throws {@link OptimisticLockError}.
   */
  update: (id: string, input: IUpdateDashboardInput) => Promise<IDashboard>;

  /**
   * Delete a dashboard. Cascades every embed token, share grant,
   * version snapshot, and annotation tied to the dashboard.
   */
  remove: (id: string) => Promise<void>;

  /** Deep-copy a dashboard, minting new widget ids. */
  duplicate: (id: string) => Promise<IDashboard>;

  /** Toggle the sidebar-pin flag on a dashboard. */
  togglePin: (id: string, next: boolean) => Promise<IDashboard>;

  /** Promote a dashboard to the user's default. */
  setDefault: (id: string) => Promise<IDashboard>;

  // ── Embed tokens ──────────────────────────────────────────────

  /** Mint a fresh embed / broadcast token. */
  issueEmbedToken: (id: string, input: IIssueEmbedTokenInput) => Promise<IIssuedEmbedToken>;

  /** Revoke a single embed / broadcast token. */
  revokeEmbedToken: (id: string, tokenId: string) => Promise<void>;

  /** Enumerate every embed token tied to a dashboard. */
  listEmbedTokens: (id: string) => Promise<readonly IEmbedTokenRecord[]>;

  /**
   * Resolve a broadcast token for the public viewer. When the token
   * carries a password gate, callers must first call
   * {@link unlockEmbedToken} and pass the returned `sessionKey`.
   */
  resolveEmbedToken: (token: string, sessionKey?: string) => Promise<IPublicEmbedDashboard>;

  /**
   * Verify a password against a password-gated broadcast and mint a
   * short-lived session key.
   */
  unlockEmbedToken: (
    token: string,
    input: IUnlockEmbedTokenInput,
  ) => Promise<IUnlockedEmbedSession>;

  // ── Share grants ──────────────────────────────────────────────

  /** Enumerate every access grant tied to a dashboard. */
  listShareGrants: (dashboardId: string) => Promise<readonly IDashboardShareGrant[]>;

  /**
   * Persist a new access grant for a dashboard. Duplicate grants
   * resolve to a no-op that returns the existing record.
   */
  addShareGrant: (
    dashboardId: string,
    input: ICreateShareGrantInput,
  ) => Promise<IDashboardShareGrant>;

  /** Revoke a single grant by id. Idempotent — unknown ids resolve. */
  removeShareGrant: (grantId: string) => Promise<void>;

  // ── Version snapshots ─────────────────────────────────────────

  /**
   * Read every persisted snapshot for a dashboard, most-recent
   * first.
   */
  listVersions: (dashboardId: string) => Promise<readonly IDashboardVersionSnapshot[]>;

  /**
   * Restore a dashboard to a persisted snapshot. Reuses the
   * optimistic-lock path — a concurrent editor is still guarded
   * against and the version counter still bumps monotonically.
   */
  restoreVersion: (dashboardId: string, versionId: string) => Promise<IDashboard>;

  // ── Widget annotations ────────────────────────────────────────

  /**
   * Read every annotation for a dashboard, ordered chronologically.
   * Owner-private — never surfaced through the embed path.
   */
  listAnnotations: (dashboardId: string) => Promise<readonly IWidgetAnnotation[]>;

  /** Append a new annotation to a widget. */
  addAnnotation: (
    dashboardId: string,
    widgetInstanceId: string,
    body: string,
  ) => Promise<IWidgetAnnotation>;

  /** Edit an existing annotation's body. */
  updateAnnotation: (annotationId: string, body: string) => Promise<IWidgetAnnotation>;

  /** Remove an annotation. Idempotent — unknown ids resolve. */
  removeAnnotation: (annotationId: string) => Promise<void>;

  // ── Broadcast Phase-6 — audit log ─────────────────────────────

  /**
   * Enumerate every audit event tied to a broadcast token. Returned
   * in reverse-chronological order (most recent first).
   *
   * The playground localStorage adapter returns an empty array —
   * without a real backend there's no persisted audit trail.
   */
  listBroadcastViewLog: (embedTokenId: string) => Promise<readonly IBroadcastViewLogRecord[]>;

  // ── Broadcast Phase-7 — rotation ──────────────────────────────

  /**
   * Rotate a broadcast token. Mints a fresh
   * {@link IIssuedEmbedToken} inheriting every field from the source
   * and marks the source with a `graceExpiresAt` window so
   * in-flight viewer sessions don't 404 mid-slideshow.
   */
  rotateEmbedToken: (
    dashboardId: string,
    tokenId: string,
    graceSeconds: number,
  ) => Promise<IIssuedEmbedToken>;

  // ── Broadcast Phase-7 — templates ─────────────────────────────

  /** Enumerate every broadcast template the caller can see. */
  listBroadcastTemplates: () => Promise<readonly IBroadcastTemplate[]>;

  /** Persist a new broadcast template. */
  createBroadcastTemplate: (input: ICreateBroadcastTemplateInput) => Promise<IBroadcastTemplate>;

  /** Delete a broadcast template. Idempotent — unknown ids resolve. */
  deleteBroadcastTemplate: (id: string) => Promise<void>;

  // ── Broadcast Phase-7 — bulk revoke ───────────────────────────

  /**
   * Preview how many tokens the given filter set would revoke. The
   * modal renders this eagerly so operators spot no-op filters before
   * confirming.
   */
  previewBulkRevoke: (filters: IBulkRevokeFilters) => Promise<IBulkRevokeResult>;

  /**
   * Revoke every token matching the filter set. Returns the number
   * of tokens that flipped from live to revoked.
   */
  bulkRevokeEmbedTokens: (filters: IBulkRevokeFilters) => Promise<IBulkRevokeResult>;
}
