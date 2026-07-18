/**
 * @file devtools-inspector-source.decorator.ts
 * @module @stackra/decorators/devtools
 *
 * @description
 * The `@DevtoolsInspectorSource(...)` class decorator — marks a
 * class as a discoverable inspector-region source.
 *
 * Stamps `IDevtoolsInspectorSourceOptions` under
 * `DEVTOOLS_INSPECTOR_SOURCE_METADATA_KEY` and applies
 * `@Injectable()`. The eventual `DevtoolsInspectorLoaderService`
 * (in `@stackra/devtools`) reads the metadata at bootstrap and
 * hydrates the inspector registry.
 */

import {
  DEVTOOLS_INSPECTOR_SOURCE_METADATA_KEY,
  type IDevtoolsInspectorSourceOptions,
} from "@stackra/contracts";

import { createDiscoverableClassDecorator, createMetadataReader } from "../core";

/**
 * Mark a class as a discoverable inspector-region source.
 *
 * @param options - Source metadata. Every field falls back to the
 *   corresponding field on the resolved instance when omitted.
 *
 * @example
 * ```typescript
 * import { DevtoolsInspectorSource } from '@stackra/decorators/devtools';
 * import type { IDevtoolsInspectorRegionSource } from '@stackra/contracts';
 *
 * @DevtoolsInspectorSource({ id: 'scope', panelId: 'scope' })
 * export class ScopeInspectorSource implements IDevtoolsInspectorRegionSource {
 *   public readonly id = 'scope';
 *   public readonly label = 'Scopes';
 *   public readonly panelId = 'scope';
 *   public collect(): readonly IDevtoolsInspectorRegion[] { … }
 * }
 * ```
 */
export const DevtoolsInspectorSource =
  createDiscoverableClassDecorator<IDevtoolsInspectorSourceOptions>(
    DEVTOOLS_INSPECTOR_SOURCE_METADATA_KEY,
  );

/**
 * Reader for `@DevtoolsInspectorSource(...)` metadata. Same
 * inheritance-aware surface as {@link devtoolsPanelMetadata}.
 */
export const devtoolsInspectorSourceMetadata =
  createMetadataReader<IDevtoolsInspectorSourceOptions>(DEVTOOLS_INSPECTOR_SOURCE_METADATA_KEY);
