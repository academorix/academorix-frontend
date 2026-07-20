/**
 * @file devtools-context-value.interface.ts
 * @module @stackra/devtools/native/interfaces
 * @description Value carried by the native devtools React context.
 *
 *   Mirrors the shape of `IDevtoolsContextValue` used by the web
 *   subpath. Web and native cannot share the actual `React.Context`
 *   instance — they render into separate trees — but the shape is
 *   deliberately identical so a cross-platform hook can be
 *   promoted to `core/hooks/` in a follow-up without churn.
 */

import type { IDevtoolsInspectorRegistry, IDevtoolsPanelsRegistry } from "@stackra/contracts";

import type { DevtoolsAnalyticsService, DevtoolsFrameStateService } from "@/core/services";
import type { IDevtoolsModuleOptions } from "@/core/interfaces";

/** Value carried by the native devtools context. */
export interface IDevtoolsNativeContextValue {
  /** Merged config the shell was mounted with. */
  readonly config: IDevtoolsModuleOptions;
  /** Panels registry — resolved from the container. */
  readonly panels: IDevtoolsPanelsRegistry;
  /** Inspector registry — resolved from the container. */
  readonly inspector: IDevtoolsInspectorRegistry;
  /** Frame-state service — persists shell layout. */
  readonly frameState: DevtoolsFrameStateService;
  /** Analytics fan-out. */
  readonly analytics: DevtoolsAnalyticsService;
  /**
   * Timestamp (`Date.now()`) captured when the provider mounted.
   * Overview panel reads this to compute session uptime.
   */
  readonly mountedAt: number;
}
