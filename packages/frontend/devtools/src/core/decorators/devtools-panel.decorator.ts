/**
 * @file devtools-panel.decorator.ts
 * @module @stackra/devtools/core/decorators
 * @description The `@DevtoolsPanel(...)` class decorator — marks a
 *   class as a discoverable devtools panel contribution.
 *
 *   Stamps `IDevtoolsPanelOptions` metadata under
 *   `DEVTOOLS_PANEL_METADATA_KEY` and applies `@Injectable()` so
 *   the container knows to construct the class via DI. The
 *   `DevtoolsPanelsLoader` queries the container at
 *   `onApplicationBootstrap` via
 *   `discovery.getProvidersByMetadata(DEVTOOLS_PANEL_METADATA_KEY)`
 *   and registers every discovered instance on the panels registry.
 */

import { Injectable } from "@stackra/container";
import { DEVTOOLS_PANEL_METADATA_KEY } from "@stackra/contracts";
import { defineMetadata } from "@vivtel/metadata";

import type { IDevtoolsPanelOptions } from "../interfaces/devtools-panel-options.interface";

/**
 * Mark a class as a discoverable devtools panel contribution.
 *
 * @param options - Panel metadata. Every field is optional — the
 *   loader falls back to values on the resolved instance
 *   (`instance.id`, `instance.title`, `instance.category`,
 *   `instance.order`) when omitted.
 *
 * @example
 * ```typescript
 * @Injectable()
 * @DevtoolsPanel({ id: 'network', title: 'Network', category: 'network' })
 * export class NetworkDevtoolsPanel implements IDevtoolsPanel {
 *   public readonly id = 'network';
 *   public readonly title = 'Network';
 *   public readonly category = 'network' as const;
 *   public readonly view = {
 *     type: 'component' as const,
 *     render: () => <NetworkPanel />,
 *   };
 * }
 * ```
 */
export function DevtoolsPanel(options: IDevtoolsPanelOptions = {}): ClassDecorator {
  // TS's built-in `ClassDecorator` types `target` as `Function`, but
  // `no-unsafe-function-type` bans the bare `Function` type. Widen to
  // the more permissive `object` — good enough for the decorator body
  // which only forwards `target` through `Injectable()` and
  // `defineMetadata()`.
  return (target: object) => {
    // Stamp `@Injectable()` FIRST so the container is aware of the
    // class before the metadata scan runs — ordering matters for
    // decorators that read `Reflect` in the wrong order.
    Injectable()(target as never);
    defineMetadata(DEVTOOLS_PANEL_METADATA_KEY, options, target);
  };
}
