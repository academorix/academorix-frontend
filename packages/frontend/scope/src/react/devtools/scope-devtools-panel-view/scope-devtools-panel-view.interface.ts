/**
 * @file scope-devtools-panel-view.interface.ts
 * @module @stackra/scope/react/devtools
 * @description Props interface for {@link ScopeDevtoolsPanelView} — the
 *   React body of the `@stackra/devtools` scope panel.
 */

import type { ScopeService } from "@/core/services/scope.service";

/**
 * Props accepted by {@link ScopeDevtoolsPanelView}.
 */
export interface ScopeDevtoolsPanelViewProps {
  /**
   * The `ScopeService` instance — optional so the view renders an
   * empty-state card in apps where the scope module isn't wired.
   * When present, the view subscribes to its snapshot via
   * `useSyncExternalStore` for tearing-free reads.
   */
  readonly service?: ScopeService;
}
