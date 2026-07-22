/**
 * @file devtools-panel.decorator.ts
 * @module @stackra/decorators/devtools
 *
 * @description
 * The `@DevtoolsPanel(...)` class decorator — marks a class as a
 * discoverable devtools panel contribution.
 *
 * Stamps `IDevtoolsPanelOptions` metadata under
 * `DEVTOOLS_PANEL_METADATA_KEY` and applies `@Injectable()` so the
 * container can construct the panel via DI. The eventual
 * `DevtoolsPanelsLoader` (in `@stackra/devtools`) queries the
 * container at `onApplicationBootstrap` via
 * `discovery.getProvidersByMetadata(DEVTOOLS_PANEL_METADATA_KEY)`
 * and registers every discovered instance on the panels registry.
 *
 * Consumers depend on `@stackra/decorators/devtools` — not on
 * `@stackra/devtools` itself — so they can declare a panel without
 * pulling the entire devtools runtime chain.
 */

import { DEVTOOLS_PANEL_METADATA_KEY, type IDevtoolsPanelOptions } from "@stackra/contracts";

import { createDiscoverableClassDecorator, createMetadataReader } from "../core";

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
 * import { DevtoolsPanel } from '@stackra/decorators/devtools';
 * import type { IDevtoolsPanel } from '@stackra/contracts';
 *
 * @DevtoolsPanel({ id: 'network', title: 'Network', category: 'network' })
 * export class NetworkDevtoolsPanel implements IDevtoolsPanel {
 *   public readonly id = 'network';
 *   public readonly title = 'Network';
 *   public readonly category = 'network' as const;
 *   public readonly view = {
 *     type: 'component' as const,
 *     render: () => // ...
 *   };
 * }
 * ```
 */
export const DevtoolsPanel = createDiscoverableClassDecorator<IDevtoolsPanelOptions>(
  DEVTOOLS_PANEL_METADATA_KEY,
);

/**
 * Reader for `@DevtoolsPanel(...)` metadata — used by the eventual
 * `DevtoolsPanelsLoader`. Exposes `get`, `has`, and `hasOwn`
 * with inheritance-aware semantics.
 *
 * @example
 * ```typescript
 * const options = devtoolsPanelMetadata.get(SomeClass);
 * if (options) { … }
 * ```
 */
export const devtoolsPanelMetadata = createMetadataReader<IDevtoolsPanelOptions>(
  DEVTOOLS_PANEL_METADATA_KEY,
);
