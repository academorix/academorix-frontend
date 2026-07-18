/**
 * @file index.ts
 * @module modules/dashboard/dashboards
 *
 * @description
 * Backward-compat barrel for the app's dashboard consumers. The domain
 * types, storage adapter, and framework hooks now live in
 * `@stackra/dashboard`; this file re-exports the surface under the
 * historical (unprefixed) type names so existing consumers keep
 * compiling verbatim.
 *
 * When we refactor consumers to import from `@stackra/dashboard`
 * directly, we can delete this file — it exists purely as the seam
 * between the historical app layout and the newly-extracted package.
 */

import { DashboardStorageService, AiMockService as PackageAiMockService } from "@stackra/dashboard";
import {
  useDashboardEditor as usePackageDashboardEditor,
  useDashboards as usePackageDashboards,
  useCurrentDashboard as usePackageCurrentDashboard,
  useWidgetKeyboardNav as usePackageWidgetKeyboardNav,
  type IUseCurrentDashboardResult,
  type IUseDashboardEditor,
  type IUseDashboardsResult,
  type IUseWidgetKeyboardNav,
  type IUseWidgetKeyboardNavInput,
  type IWidgetKeyboardProps,
} from "@stackra/dashboard/react";

import type {
  CustomizePanelTab as PackageCustomizePanelTab,
  DashboardDensity as PackageDashboardDensity,
  DashboardShareLevel as PackageDashboardShareLevel,
  IAiSuggestion,
  IAiTurn,
  IAskAssistantContext,
  IBroadcastTemplate,
  IBroadcastViewLogRecord,
  IBulkRevokeFilters,
  IBulkRevokeResult,
  ICreateBroadcastTemplateInput,
  ICreateDashboardInput,
  ICreateShareGrantInput,
  IDashboard,
  IDashboardAccessSubject,
  IDashboardFilters,
  IDashboardNavEntry,
  IDashboardShareGrant,
  IDashboardStorageAdapter,
  IDashboardTemplate,
  IDashboardVersionSnapshot,
  IEmbedTokenRecord,
  IIssuedEmbedToken,
  IIssueEmbedTokenInput,
  ILayoutItem,
  IPublicEmbedDashboard,
  IRenderableLayout,
  IUnlockedEmbedSession,
  IUnlockEmbedTokenInput,
  IUpdateDashboardInput,
  IWidgetAnnotation,
  IWidgetInstance,
} from "@stackra/dashboard";

// ── Re-export constants + errors + helpers ────────────────────────
export {
  BUILT_IN_ANALYTICS_ID,
  BUILT_IN_OVERVIEW_ID,
  DASHBOARD_TEMPLATES,
  DashboardNotFoundError,
  EmbedTokenInvalidError,
  EmbedTokenPasswordRequiredError,
  GRID_COLUMNS,
  OptimisticLockError,
  buildAnalyticsDashboard,
  buildOverviewDashboard,
  canAccessDashboard,
  dashboardHref,
  ensureUniqueSlug,
  materialiseTemplate,
  slugify,
} from "@stackra/dashboard";

// ── Type aliases: strip the historical `I` prefix ─────────────────

export type AiSuggestion = IAiSuggestion;
export type AiTurn = IAiTurn;
export type AskAssistantContext = IAskAssistantContext;
export type CustomizePanelTab = PackageCustomizePanelTab;
export type DashboardDensity = PackageDashboardDensity;
export type DashboardShareLevel = PackageDashboardShareLevel;
export type BroadcastTemplate = IBroadcastTemplate;
export type BroadcastViewLogRecord = IBroadcastViewLogRecord;
export type BulkRevokeFilters = IBulkRevokeFilters;
export type BulkRevokeResult = IBulkRevokeResult;
export type CreateBroadcastTemplateInput = ICreateBroadcastTemplateInput;
export type CreateDashboardInput = ICreateDashboardInput;
export type CreateShareGrantInput = ICreateShareGrantInput;
export type Dashboard = IDashboard;
export type DashboardAccessSubject = IDashboardAccessSubject;
export type DashboardFilters = IDashboardFilters;
export type DashboardNavEntry = IDashboardNavEntry;
export type DashboardShareGrant = IDashboardShareGrant;
export type DashboardStorageAdapter = IDashboardStorageAdapter;
export type DashboardTemplate = IDashboardTemplate;
export type DashboardVersionSnapshot = IDashboardVersionSnapshot;
export type EmbedTokenRecord = IEmbedTokenRecord;
export type IssueEmbedTokenInput = IIssueEmbedTokenInput;
export type IssuedEmbedToken = IIssuedEmbedToken;
export type LayoutItem = ILayoutItem;
export type PublicEmbedDashboard = IPublicEmbedDashboard;
export type RenderableLayout = IRenderableLayout;
export type UnlockEmbedTokenInput = IUnlockEmbedTokenInput;
export type UnlockedEmbedSession = IUnlockedEmbedSession;
export type UpdateDashboardInput = IUpdateDashboardInput;
export type UseCurrentDashboardResult = IUseCurrentDashboardResult;
export type UseDashboardEditor = IUseDashboardEditor;
export type UseDashboardsResult = IUseDashboardsResult;
export type UseWidgetKeyboardNav = IUseWidgetKeyboardNav;
export type UseWidgetKeyboardNavInput = IUseWidgetKeyboardNavInput;
export type WidgetAnnotation = IWidgetAnnotation;
export type WidgetInstance = IWidgetInstance;
export type WidgetKeyboardProps = IWidgetKeyboardProps;

// Legacy re-exports from the `use-current-dashboard` module — used
// by the app router shim.
export { DEFAULT_DASHBOARD_ROUTE_SLUG, resolveCurrent } from "@stackra/dashboard/react";

// ── Singletons ────────────────────────────────────────────────────
//
// The old app-side `dashboardStorage` singleton is reconstructed
// here so existing consumers (`import { dashboardStorage } from
// "@/modules/dashboard/dashboards"`) keep working verbatim. The
// package's `DashboardStorageService` is what does the work; we just
// pre-instantiate it with the playground owner/tenant coordinates.

/**
 * Legacy playground storage singleton. New code should inject
 * `DASHBOARD_STORAGE` from `@stackra/dashboard` via the DI container
 * — this export is preserved for consumers that pre-date the DI
 * wiring in the app.
 */
export const dashboardStorage: IDashboardStorageAdapter = new DashboardStorageService();

// ── Hook wrappers ─────────────────────────────────────────────────
//
// The package's hooks take the storage adapter (and, for the
// keyboard-nav hook, a plain options object) as arguments. The old
// app-side hooks were bound to the module-scoped `dashboardStorage`
// singleton — wrap the package hooks so existing call sites keep
// their zero-arg contract.

/**
 * Legacy `useDashboards()` — binds to the playground storage
 * singleton. New consumers should inject `DASHBOARD_STORAGE` and call
 * `useDashboards(storage)` from `@stackra/dashboard/react`.
 */
export function useDashboards(): IUseDashboardsResult {
  return usePackageDashboards(dashboardStorage);
}

/**
 * `useCurrentDashboard(registry, slug)` — re-exported verbatim from
 * the package. Existing app call sites already pass the registry
 * hook explicitly.
 */
export const useCurrentDashboard = usePackageCurrentDashboard;

/**
 * `useDashboardEditor(source, persist)` — re-exported verbatim from
 * the package. The app call sites already pass a memoised persist
 * callback bound to `dashboardStorage`.
 */
export const useDashboardEditor = usePackageDashboardEditor;

/**
 * Re-export the keyboard-nav hook verbatim — its signature already
 * matches the app's expectation.
 */
export const useWidgetKeyboardNav = usePackageWidgetKeyboardNav;

// ── AI mock ───────────────────────────────────────────────────────

/** Legacy `askAssistant` — binds to a shared {@link PackageAiMockService}. */
const aiMockInstance = new PackageAiMockService();

/**
 * Legacy `askAssistant` — proxied to a shared {@link PackageAiMockService}
 * instance so the old call shape stays `askAssistant(prompt, ctx)`.
 */
export function askAssistant(prompt: string, context: IAskAssistantContext): Promise<IAiTurn> {
  return aiMockInstance.askAssistant(prompt, context);
}

export { AI_SUGGESTED_PROMPTS } from "@stackra/dashboard";
