/**
 * @file index.ts
 * @module @stackra/dashboard/core
 * @description Public API for the `@stackra/dashboard` core.
 *
 *   Exposes the domain interfaces, types, errors, constants, tokens,
 *   utilities, services, and the composite `DashboardModule`. Never
 *   re-exports from `@stackra/contracts` — consumers reach contracts
 *   directly (per `contract-reexports.md`).
 */

// ── Module ─────────────────────────────────────────────────────
export { DashboardModule, type IDashboardFeatureOptions } from "./dashboard.module";
export type { IDashboardModuleOptions } from "./interfaces/dashboard-module-options.interface";

// ── Base classes ───────────────────────────────────────────────
export { BaseWidget } from "./base";

// ── Decorators ─────────────────────────────────────────────────
export { Widget } from "./decorators";

// ── Metadata helpers ───────────────────────────────────────────
export { hasWidget, readWidgetMetadata } from "./metadata";

// ── Registries ─────────────────────────────────────────────────
export {
  WidgetCohortRegistry,
  WidgetRegistry,
  WidgetRendererRegistry,
} from "./registries";

/**
 * @deprecated Renamed to `WidgetRendererRegistry` in v0.2. The alias
 *   keeps app-side shims that imported `WidgetRegistryService`
 *   compiling; delete in the next minor bump. Consumers that called
 *   the old `.renderWidget(key, ctx)` method should switch to
 *   `<WidgetRenderer widgetKey={key} registry={rendererRegistry} />`
 *   or `rendererRegistry.get(key)?.(context)`.
 */
export { WidgetRendererRegistry as WidgetRegistryService } from "./registries";

// ── Services ───────────────────────────────────────────────────
export { DashboardStorageService } from "./services/dashboard-storage.service";
export { WidgetCatalogueService } from "./services/widget-catalogue.service";
export { WidgetLoader } from "./services/widget-loader.service";

// ── Tokens ─────────────────────────────────────────────────────
export { DASHBOARD_CONFIG } from "./tokens/dashboard-config.token";
export { DASHBOARD_STORAGE } from "./tokens/dashboard-storage.token";
export { WIDGET_CATALOGUE_SERVICE } from "./tokens/widget-catalogue.token";
export { WIDGET_COHORT_REGISTRY } from "./tokens/widget-cohort-registry.token";
export { WIDGET_REGISTRY } from "./tokens/widget-registry.token";
export { WIDGET_RENDERER_REGISTRY } from "./tokens/widget-renderer-registry.token";

// ── Constants ──────────────────────────────────────────────────
export {
  BUILT_IN_ANALYTICS_ID,
  BUILT_IN_OVERVIEW_ID,
  COHORT_KEY_PATTERN,
  DASHBOARD_TEMPLATES,
  DEFAULT_DASHBOARD_CONFIG,
  DEFAULT_WIDGET_COHORTS,
  GRID_COLUMNS,
  PLAYGROUND_OWNER_ID,
  PLAYGROUND_TENANT_ID,
  WIDGET_KEY_PATTERN,
  WIDGET_METADATA_KEY,
} from "./constants";

// ── Errors ─────────────────────────────────────────────────────
export {
  DashboardNotFoundError,
  DuplicateWidgetCohortError,
  DuplicateWidgetKeyError,
  DuplicateWidgetRendererError,
  EmbedTokenInvalidError,
  EmbedTokenPasswordRequiredError,
  InvalidWidgetMetadataError,
  OptimisticLockError,
} from "./errors";

// ── Utils ──────────────────────────────────────────────────────
export {
  autoLayout,
  buildAnalyticsDashboard,
  buildLayoutsForKeys,
  buildOverviewDashboard,
  canAccessDashboard,
  constantTimeEquals,
  dashboardHref,
  defineConfig,
  ensureUniqueSlug,
  materialiseTemplate,
  mergeConfig,
  normaliseDashboard,
  normaliseLayouts,
  normaliseStringList,
  normaliseWhitelabel,
  randomId,
  randomToken,
  sha256Hex,
  slugify,
  stableWidgetInstance,
  type WhitelabelInput,
} from "./utils";

// ── Interfaces ─────────────────────────────────────────────────
export type {
  IAiSuggestion,
  IAiTurn,
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
  IDashboardLayout,
  IDashboardLayoutBreakpoint,
  IDashboardLayoutItem,
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
  IRegisteredWidget,
  IRenderableLayout,
  IUnlockedEmbedSession,
  IUnlockEmbedTokenInput,
  IUpdateDashboardInput,
  IWidgetAnnotation,
  IWidgetCohortEntry,
  IWidgetCohortGroup,
  IWidgetDefaultLayout,
  IWidgetDefinition,
  IWidgetEntry,
  IWidgetInstance,
  IWidgetMetadata,
  IWidgetProvider,
  IWidgetRendererContext,
} from "./interfaces";

// ── Types ──────────────────────────────────────────────────────
export type {
  AiSuggestionKind,
  BroadcastKind,
  CustomizePanelTab,
  DashboardBreakpoint,
  DashboardDensity,
  DashboardLayoutMode,
  DashboardShareLevel,
  DashboardVisibility,
  WidgetCategory,
  WidgetCohort,
  WidgetRenderer,
  WidgetSpan,
} from "./types";
