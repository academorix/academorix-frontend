/**
 * @file devtools-panel-options.interface.ts
 * @module @stackra/devtools/core/interfaces
 * @description Options accepted by the `@DevtoolsPanel(...)` class
 *   decorator — the metadata payload stamped on the target class
 *   under `DEVTOOLS_PANEL_METADATA_KEY` and read by the discovery
 *   loader.
 *
 *   Every field mirrors a facet of `IDevtoolsPanel`. Keep the two
 *   shapes in sync — the panel loader will fall back to the values
 *   on the class instance for fields omitted from the decorator
 *   metadata, so authors can pick whichever is more ergonomic.
 */

import type { DevtoolsCategory, IDevtoolsAuthGate } from '@stackra/contracts';

/**
 * Options for the `@DevtoolsPanel(options)` class decorator.
 *
 * @example
 * ```typescript
 * @Injectable()
 * @DevtoolsPanel({ id: 'network', title: 'Network', category: 'network' })
 * export class NetworkDevtoolsPanel implements IDevtoolsPanel { … }
 * ```
 */
export interface IDevtoolsPanelOptions {
  /**
   * Unique panel id — matches `IDevtoolsPanel.id`. When omitted the
   * loader falls back to `instance.id` on the resolved class.
   */
  readonly id?: string;
  /**
   * Human-readable title — matches `IDevtoolsPanel.title`. Falls
   * back to `instance.title` when omitted.
   */
  readonly title?: string;
  /**
   * Category the panel appears in. Falls back to `instance.category`,
   * then to `'modules'`.
   */
  readonly category?: DevtoolsCategory;
  /** Sort order inside the category. Lower first. */
  readonly order?: number;
  /**
   * Optional gate — kept in decorator metadata so a package can
   * declare the gate without touching the instance surface.
   */
  readonly requireAuth?: IDevtoolsAuthGate;
}
