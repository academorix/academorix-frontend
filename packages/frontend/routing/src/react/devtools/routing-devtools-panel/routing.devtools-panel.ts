/**
 * @file routing.devtools-panel.ts
 * @module @stackra/routing/react/devtools/routing-devtools-panel
 * @description The `@stackra/devtools` panel contribution for
 *   `@stackra/routing` (ported from ssr's `SsrDevtoolsPanel` per
 *   PLAN v3.10.4).
 *
 *   Reads the `RouteRegistryService` to surface hydration status
 *   and the shape of the route tree. Read-only — mutating routes
 *   at runtime is not a supported flow.
 */

import { createElement, type ReactNode } from "react";
import { CubeTransparentIcon } from "@stackra/ui/icons/heroicon/outline";
import { DevtoolsPanel } from "@stackra/decorators/devtools";
import type { DevtoolsCategory, IDevtoolsPanel, IDevtoolsView } from "@stackra/contracts";

import { RouteRegistryService } from "@/core/services/route-registry.service";
import { RoutingDevtoolsPanelView } from "./routing-devtools-panel-view";

/**
 * The routing devtools panel.
 *
 * `@DevtoolsPanel(...)` from `@stackra/decorators/devtools` auto-
 * applies `@Injectable()` so the class is available to the container
 * without a second decorator.
 */
@DevtoolsPanel({
  id: "routing",
  title: "Routing",
  category: "framework",
  order: 10,
})
export class RoutingDevtoolsPanel implements IDevtoolsPanel {
  /** @inheritdoc */
  public readonly id = "routing";
  /** @inheritdoc */
  public readonly title = "Routing";
  /** @inheritdoc */
  public readonly category: DevtoolsCategory = "framework";
  /** @inheritdoc */
  public readonly order = 10;
  /** @inheritdoc */
  public readonly icon: ReactNode = createElement(CubeTransparentIcon, {
    className: "size-4",
  });
  /** @inheritdoc */
  public readonly view: IDevtoolsView;

  /**
   * @param registry - The `RouteRegistryService` the panel reads to
   *   surface the route tally.
   */
  public constructor(private readonly registry: RouteRegistryService) {
    this.view = {
      type: "component",
      render: (): ReactNode => createElement(RoutingDevtoolsPanelView, { registry: this.registry }),
    };
  }

  /**
   * Show the total number of registered routes on the nav rail.
   *
   * @returns Route count or `null` when the registry is empty.
   */
  public badge(): number | null {
    try {
      const total = this.registry.listRoutes().length;
      return total > 0 ? total : null;
    } catch {
      // fail-soft — the registry may not be wired in test scenarios.
      return null;
    }
  }
}
