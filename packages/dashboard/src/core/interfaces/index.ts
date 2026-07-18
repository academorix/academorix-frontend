/**
 * @file index.ts
 * @module @stackra/dashboard/core/interfaces
 * @description Public API barrel for the `interfaces/` category. Every
 *   export is a package-owned `export interface`.
 */

export type { IAiSuggestion } from "./ai-suggestion.interface";
export type { IAiTurn } from "./ai-turn.interface";
export type { IBroadcastTemplate } from "./broadcast-template.interface";
export type { IBroadcastViewLogRecord } from "./broadcast-view-log-record.interface";
export type { IBulkRevokeFilters } from "./bulk-revoke-filters.interface";
export type { IBulkRevokeResult } from "./bulk-revoke-result.interface";
export type { ICreateBroadcastTemplateInput } from "./create-broadcast-template-input.interface";
export type { ICreateDashboardInput } from "./create-dashboard-input.interface";
export type { ICreateShareGrantInput } from "./create-share-grant-input.interface";
export type { IDashboard } from "./dashboard.interface";
export type { IDashboardAccessSubject } from "./dashboard-access-subject.interface";
export type { IDashboardFilters } from "./dashboard-filters.interface";
export type { IDashboardLayout } from "./dashboard-layout.interface";
export type { IDashboardLayoutBreakpoint } from "./dashboard-layout-breakpoint.interface";
export type { IDashboardLayoutItem } from "./dashboard-layout-item.interface";
export type { IDashboardNavEntry } from "./dashboard-nav-entry.interface";
export type { IDashboardShareGrant } from "./dashboard-share-grant.interface";
export type { IDashboardStorageAdapter } from "./dashboard-storage-adapter.interface";
export type { IDashboardTemplate } from "./dashboard-template.interface";
export type { IDashboardVersionSnapshot } from "./dashboard-version-snapshot.interface";
export type { IEmbedTokenRecord } from "./embed-token-record.interface";
export type { IIssuedEmbedToken } from "./issued-embed-token.interface";
export type { IIssueEmbedTokenInput } from "./issue-embed-token-input.interface";
export type { ILayoutItem } from "./layout-item.interface";
export type { IPublicEmbedDashboard } from "./public-embed-dashboard.interface";
export type { IRenderableLayout } from "./renderable-layout.interface";
export type { IUnlockedEmbedSession } from "./unlocked-embed-session.interface";
export type { IUnlockEmbedTokenInput } from "./unlock-embed-token-input.interface";
export type { IUpdateDashboardInput } from "./update-dashboard-input.interface";
export type { IWidgetAnnotation } from "./widget-annotation.interface";
export type { IWidgetCohortEntry } from "./widget-cohort-entry.interface";
export type { IWidgetCohortGroup } from "./widget-cohort-group.interface";
export type { IWidgetDefaultLayout } from "./widget-default-layout.interface";
export type { IWidgetDefinition } from "./widget-definition.interface";
export type { IWidgetEntry } from "./widget-entry.interface";
export type { IWidgetInstance } from "./widget-instance.interface";
export type { IWidgetMetadata } from "./widget-metadata.interface";
export type { IWidgetProvider } from "./widget-provider.interface";
export type { IRegisteredWidget } from "./registered-widget.interface";
export type { IWidgetRendererContext } from "./widget-renderer-context.interface";
export type { IDashboardModuleOptions } from "./dashboard-module-options.interface";
