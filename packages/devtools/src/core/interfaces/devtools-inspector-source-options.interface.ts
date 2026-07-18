/**
 * @file devtools-inspector-source-options.interface.ts
 * @module @stackra/devtools/core/interfaces
 * @description Options accepted by the `@DevtoolsInspectorSource(...)`
 *   class decorator — the metadata payload stamped on the target
 *   class under `DEVTOOLS_INSPECTOR_SOURCE_METADATA_KEY`.
 */

/**
 * Options for the `@DevtoolsInspectorSource(options)` class
 * decorator. Every field is optional; the loader falls back to the
 * instance's own `id`/`label`/`panelId` when omitted.
 *
 * @example
 * ```typescript
 * @Injectable()
 * @DevtoolsInspectorSource({ id: 'scope', panelId: 'scope' })
 * export class ScopeInspectorSource implements IDevtoolsInspectorRegionSource { … }
 * ```
 */
export interface IDevtoolsInspectorSourceOptions {
  /** Source id — falls back to the instance `id`. */
  readonly id?: string;
  /** Human-readable label — falls back to the instance `label`. */
  readonly label?: string;
  /** Owning panel id — falls back to the instance `panelId`. */
  readonly panelId?: string;
}
