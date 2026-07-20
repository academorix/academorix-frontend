/**
 * @file index.ts
 * @module @stackra/dashboard/react/hooks/use-widget-layout
 * @description Barrel for the widget-layout hook.
 */

export {
  clearStoredLayout,
  computeDefaultLayoutItems,
  LAYOUT_SCHEMA_VERSION,
  OVERVIEW_GRID_COLUMNS,
  readStoredLayout,
  useWidgetLayout,
  writeStoredLayout,
  type IUseWidgetLayoutOptions,
} from "./use-widget-layout.hook";
export type { IUseWidgetLayoutResult } from "./use-widget-layout.interface";
