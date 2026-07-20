/**
 * @file storage.devtools-panel.ts
 * @module @stackra/storage/react/devtools
 * @description The `@stackra/devtools` panel contribution for
 *   `@stackra/storage`.
 *
 *   Renders a read-only introspection view — one card per configured
 *   storage instance — inside the devtools shell. Surfaces the
 *   backend driver name, entry count (via `IStorage.keys()`), and a
 *   sample of the first 20 keys. Registered by
 *   `StorageModule.forRoot()` / `StorageModule.forRootAsync()` via
 *   `DevtoolsModule.forFeature([...])`; both the web
 *   (`WebStorageModule`) and native (`NativeStorageModule`) subpath
 *   modules extend the base module, so wiring the panel once on the
 *   base module transitively covers every platform.
 */

import { createElement, type ReactNode } from "react";
import { ArchiveBoxIcon } from "@stackra/ui/icons/heroicon/outline";
import { Inject, Injectable, Optional } from "@stackra/container";
import {
  STORAGE_CONFIG,
  STORAGE_MANAGER,
  type DevtoolsCategory,
  type IDevtoolsPanel,
  type IDevtoolsView,
  type IStorageConfig,
  type IStorageManager,
} from "@stackra/contracts";

import { DevtoolsPanel } from "@stackra/devtools";

import { StorageDevtoolsPanelView } from "./storage-devtools-panel-view";

/**
 * The devtools storage panel.
 *
 * @example
 * ```typescript
 * // Registered automatically inside StorageModule.forRoot() — every
 * // platform variant (WebStorageModule, NativeStorageModule) inherits
 * // the panel through the shared base module.
 * imports: [
 *   DevtoolsModule.forRoot(),
 *   WebStorageModule.forRoot({
 *     default: 'localStorage',
 *     stores: { localStorage: { driver: 'localStorage' } },
 *   }),
 * ]
 * ```
 */
@Injectable()
@DevtoolsPanel({
  id: "storage",
  title: "Storage",
  category: "data",
  order: 30,
})
export class StorageDevtoolsPanel implements IDevtoolsPanel {
  /** @inheritdoc */
  public readonly id = "storage";
  /** @inheritdoc */
  public readonly title = "Storage";
  /** @inheritdoc */
  public readonly category: DevtoolsCategory = "data";
  /** @inheritdoc */
  public readonly order = 30;
  /** @inheritdoc */
  public readonly icon: ReactNode = createElement(ArchiveBoxIcon, {
    className: "size-4",
  });
  /** @inheritdoc */
  public readonly view: IDevtoolsView;

  /**
   * @param config - The merged storage module configuration, injected
   *   via the `STORAGE_CONFIG` token. Optional so the panel still
   *   resolves in tests / minimal wirings where the storage runtime
   *   isn't installed — the view then renders an empty-state card.
   * @param manager - The `IStorageManager` — optional for the same
   *   reason. Used by the view to resolve named `IStorage` instances
   *   and read their `keys()` sample.
   */
  public constructor(
    @Optional() @Inject(STORAGE_CONFIG) private readonly config?: IStorageConfig,
    @Optional() @Inject(STORAGE_MANAGER) private readonly manager?: IStorageManager,
  ) {
    this.view = {
      type: "component",
      // The view reads a snapshot of the config directly for the
      // static shape (per-instance name + driver), then reads
      // per-instance `keys()` lazily via the manager.
      render: (): ReactNode =>
        createElement(StorageDevtoolsPanelView, {
          config: this.config,
          manager: this.manager,
        }),
    };
  }

  /**
   * The nav-rail badge counter — the number of configured storage
   * instances. Returns `null` when the storage module isn't wired
   * (no config) or the config declares zero instances.
   */
  public badge(): number | null {
    // fail-soft — a misshapen config must not throw here.
    try {
      const count = Object.keys(this.config?.stores ?? {}).length;
      return count > 0 ? count : null;
    } catch {
      return null;
    }
  }
}
