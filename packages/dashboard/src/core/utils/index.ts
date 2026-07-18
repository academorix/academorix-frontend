/**
 * @file index.ts
 * @module @stackra/dashboard/core/utils
 * @description Public API barrel for the `utils/` category.
 */

export { autoLayout } from "./auto-layout.util";
export { buildAnalyticsDashboard } from "./build-analytics-dashboard.util";
export { buildLayoutsForKeys } from "./build-layouts-for-keys.util";
export { buildOverviewDashboard } from "./build-overview-dashboard.util";
export { canAccessDashboard } from "./can-access-dashboard.util";
export { constantTimeEquals } from "./constant-time-equals.util";
export { dashboardHref } from "./dashboard-href.util";
export { defineConfig } from "./define-config.util";
export { ensureUniqueSlug } from "./ensure-unique-slug.util";
export { materialiseTemplate } from "./materialise-template.util";
export { mergeConfig } from "./merge-config.util";
export { normaliseDashboard } from "./normalise-dashboard.util";
export { normaliseLayouts } from "./normalise-layouts.util";
export { normaliseStringList } from "./normalise-string-list.util";
export { normaliseWhitelabel } from "./normalise-whitelabel.util";
export type { WhitelabelInput } from "./normalise-whitelabel.util";
export { randomId } from "./random-id.util";
export { randomToken } from "./random-token.util";
export { sha256Hex } from "./sha256-hex.util";
export { slugify } from "./slugify.util";
export { stableWidgetInstance } from "./stable-widget-instance.util";
