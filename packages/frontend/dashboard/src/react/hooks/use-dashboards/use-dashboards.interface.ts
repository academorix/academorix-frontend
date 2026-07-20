/**
 * @file use-dashboards.interface.ts
 * @module @stackra/dashboard/react/hooks/use-dashboards
 * @description Public return shape for {@link useDashboards}.
 */

import type { IBroadcastTemplate } from "@/core/interfaces/broadcast-template.interface";
import type { IBroadcastViewLogRecord } from "@/core/interfaces/broadcast-view-log-record.interface";
import type { IBulkRevokeFilters } from "@/core/interfaces/bulk-revoke-filters.interface";
import type { IBulkRevokeResult } from "@/core/interfaces/bulk-revoke-result.interface";
import type { ICreateBroadcastTemplateInput } from "@/core/interfaces/create-broadcast-template-input.interface";
import type { ICreateDashboardInput } from "@/core/interfaces/create-dashboard-input.interface";
import type { ICreateShareGrantInput } from "@/core/interfaces/create-share-grant-input.interface";
import type { IDashboard } from "@/core/interfaces/dashboard.interface";
import type { IDashboardShareGrant } from "@/core/interfaces/dashboard-share-grant.interface";
import type { IDashboardVersionSnapshot } from "@/core/interfaces/dashboard-version-snapshot.interface";
import type { IIssuedEmbedToken } from "@/core/interfaces/issued-embed-token.interface";
import type { IIssueEmbedTokenInput } from "@/core/interfaces/issue-embed-token-input.interface";
import type { IUpdateDashboardInput } from "@/core/interfaces/update-dashboard-input.interface";
import type { IWidgetAnnotation } from "@/core/interfaces/widget-annotation.interface";

/**
 * Handle returned by {@link useDashboards}. Every mutator refreshes
 * the cached list on completion so callers never see stale data.
 */
export interface IUseDashboardsResult {
  /** Every dashboard the user can currently see. */
  dashboards: readonly IDashboard[];

  /**
   * True until the first list read completes. Consumers can render a
   * skeleton until this flips false.
   */
  isLoading: boolean;

  /** True when a mutation is currently in flight. */
  isMutating: boolean;

  /** Any error thrown by the last operation — reset by the next call. */
  error: Error | null;

  /** Trigger a manual refresh. */
  refresh: () => Promise<void>;

  create: (input: ICreateDashboardInput) => Promise<IDashboard>;
  update: (id: string, input: IUpdateDashboardInput) => Promise<IDashboard>;
  remove: (id: string) => Promise<void>;
  duplicate: (id: string) => Promise<IDashboard>;
  togglePin: (id: string, next: boolean) => Promise<IDashboard>;
  setDefault: (id: string) => Promise<IDashboard>;
  issueEmbedToken: (id: string, input: IIssueEmbedTokenInput) => Promise<IIssuedEmbedToken>;
  revokeEmbedToken: (id: string, tokenId: string) => Promise<void>;
  rotateEmbedToken: (
    dashboardId: string,
    tokenId: string,
    graceSeconds: number,
  ) => Promise<IIssuedEmbedToken>;
  listBroadcastViewLog: (embedTokenId: string) => Promise<readonly IBroadcastViewLogRecord[]>;

  /** Tenant-wide snapshot of every broadcast template. */
  broadcastTemplates: readonly IBroadcastTemplate[];
  createBroadcastTemplate: (input: ICreateBroadcastTemplateInput) => Promise<IBroadcastTemplate>;
  deleteBroadcastTemplate: (id: string) => Promise<void>;

  previewBulkRevoke: (filters: IBulkRevokeFilters) => Promise<IBulkRevokeResult>;
  bulkRevokeEmbedTokens: (filters: IBulkRevokeFilters) => Promise<IBulkRevokeResult>;

  /** Tenant-wide snapshot of every access grant. */
  shareGrants: readonly IDashboardShareGrant[];
  listShareGrants: (dashboardId: string) => Promise<readonly IDashboardShareGrant[]>;
  addShareGrant: (
    dashboardId: string,
    input: ICreateShareGrantInput,
  ) => Promise<IDashboardShareGrant>;
  removeShareGrant: (grantId: string) => Promise<void>;

  listVersions: (dashboardId: string) => Promise<readonly IDashboardVersionSnapshot[]>;
  restoreVersion: (dashboardId: string, versionId: string) => Promise<IDashboard>;

  /** Tenant-wide snapshot of every widget annotation. */
  annotations: readonly IWidgetAnnotation[];
  listAnnotations: (dashboardId: string) => Promise<readonly IWidgetAnnotation[]>;
  addAnnotation: (
    dashboardId: string,
    widgetInstanceId: string,
    body: string,
  ) => Promise<IWidgetAnnotation>;
  updateAnnotation: (annotationId: string, body: string) => Promise<IWidgetAnnotation>;
  removeAnnotation: (annotationId: string) => Promise<void>;
}
