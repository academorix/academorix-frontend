/**
 * @file widget.types.ts
 * @module modules/dashboard/widgets/widget.types
 *
 * @description
 * Backward-compat shim. Widget types moved to `@stackra/dashboard`;
 * this file re-exports them under the historical (unprefixed) names.
 */

export type {
  IDashboardLayout as DashboardLayout,
  IDashboardLayoutBreakpoint as DashboardLayoutBreakpoint,
  IDashboardLayoutItem as DashboardLayoutItem,
  IWidgetDefaultLayout as WidgetDefaultLayout,
  IWidgetDefinition as WidgetDefinition,
  IWidgetRendererContext as WidgetRendererContext,
  WidgetCategory,
  WidgetRenderer,
} from "@stackra/dashboard";
