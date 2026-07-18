/**
 * @file use-widget-keyboard-nav.ts
 * @module modules/dashboard/dashboards/use-widget-keyboard-nav
 *
 * @description
 * Backward-compat shim. The keyboard-nav hook lives in
 * `@stackra/dashboard/react`; this file re-exports it plus the
 * historical type aliases so existing app consumers keep working.
 */

import type {
  IUseWidgetKeyboardNav,
  IUseWidgetKeyboardNavInput,
  IWidgetKeyboardProps,
} from "@stackra/dashboard/react";

export { useWidgetKeyboardNav } from "@stackra/dashboard/react";

export type UseWidgetKeyboardNav = IUseWidgetKeyboardNav;
export type UseWidgetKeyboardNavInput = IUseWidgetKeyboardNavInput;
export type WidgetKeyboardProps = IWidgetKeyboardProps;
