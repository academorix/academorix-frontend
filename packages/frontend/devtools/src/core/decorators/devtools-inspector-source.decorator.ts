/**
 * @file devtools-inspector-source.decorator.ts
 * @module @stackra/devtools/core/decorators
 * @description The `@DevtoolsInspectorSource(...)` class decorator —
 *   marks a class as a discoverable inspector-region source.
 */

import { defineMetadata } from "@vivtel/metadata";
import { Injectable } from "@stackra/container";
import { DEVTOOLS_INSPECTOR_SOURCE_METADATA_KEY } from "@stackra/contracts";

import type { IDevtoolsInspectorSourceOptions } from "../interfaces/devtools-inspector-source-options.interface";

/**
 * Mark a class as a discoverable inspector-region source.
 *
 * @param options - Source metadata. Every field falls back to the
 *   corresponding field on the resolved instance when omitted.
 *
 * @example
 * ```typescript
 * @Injectable()
 * @DevtoolsInspectorSource({ id: 'scope', panelId: 'scope' })
 * export class ScopeInspectorSource implements IDevtoolsInspectorRegionSource {
 *   public readonly id = 'scope';
 *   public readonly label = 'Scopes';
 *   public readonly panelId = 'scope';
 *   public collect(): readonly IDevtoolsInspectorRegion[] { … }
 * }
 * ```
 */
export function DevtoolsInspectorSource(
  options: IDevtoolsInspectorSourceOptions = {},
): ClassDecorator {
  return (target: Function) => {
    // Stamp `@Injectable()` first — see `devtools-panel.decorator.ts`
    // for the ordering rationale.
    Injectable()(target);
    defineMetadata(DEVTOOLS_INSPECTOR_SOURCE_METADATA_KEY, options, target);
  };
}
