/**
 * @file devtools-context-value.interface.ts
 * @module @stackra/devtools/react/contexts
 * @description Shape of the value the `DevtoolsContext` carries.
 *
 *   The provider populates every field from the DI container +
 *   the merged config. Consumers narrow via the higher-level hooks
 *   (`useDevtoolsPanels`, `useDevtoolsFrameState`, …) rather than
 *   reading the context directly.
 */

import type { IDevtoolsInspectorRegistry, IDevtoolsPanelsRegistry } from '@stackra/contracts';

import type { DevtoolsAnalyticsService, DevtoolsFrameStateService } from '@/core/services';
import type { IDevtoolsModuleOptions } from '@/core/interfaces';

/**
 * Value carried by the devtools React context.
 */
export interface IDevtoolsContextValue {
  /** Merged config the shell was mounted with. */
  readonly config: IDevtoolsModuleOptions;
  /** Panels registry — resolved from the container's `DEVTOOLS_REGISTRY`. */
  readonly panels: IDevtoolsPanelsRegistry;
  /** Inspector registry — resolved from `DEVTOOLS_INSPECTOR_REGISTRY`. */
  readonly inspector: IDevtoolsInspectorRegistry;
  /** Frame-state service — persists shell layout. */
  readonly frameState: DevtoolsFrameStateService;
  /** Analytics fan-out. */
  readonly analytics: DevtoolsAnalyticsService;
  /**
   * Timestamp (via `Date.now()`) captured when the provider mounted.
   * Used by the Overview panel to render session uptime.
   */
  readonly mountedAt: number;
}
