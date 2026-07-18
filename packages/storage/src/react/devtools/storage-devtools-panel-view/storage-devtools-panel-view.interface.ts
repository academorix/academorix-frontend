/**
 * @file storage-devtools-panel-view.interface.ts
 * @module @stackra/storage/react/devtools
 * @description Props interface for {@link StorageDevtoolsPanelView} —
 *   the React body of the `@stackra/devtools` storage panel.
 */

import type { IStorageConfig, IStorageManager } from '@stackra/contracts';

/**
 * Props accepted by {@link StorageDevtoolsPanelView}.
 */
export interface StorageDevtoolsPanelViewProps {
  /**
   * The merged storage module configuration. Passed through by the
   * panel class rather than resolved inside the view so tests can
   * feed a fixture without wiring the full DI graph. Optional so
   * the view renders an empty-state card when the storage module
   * isn't wired.
   */
  readonly config?: IStorageConfig;

  /**
   * The `IStorageManager` — optional for the same reason as
   * {@link StorageDevtoolsPanelViewProps.config}. When present the
   * view reads sample keys via
   * `manager.instance(name).keys()`. When absent the view shows the
   * static config only.
   */
  readonly manager?: IStorageManager;
}
