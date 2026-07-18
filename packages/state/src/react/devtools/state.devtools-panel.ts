/**
 * @file state.devtools-panel.ts
 * @module @stackra/state/react/devtools
 * @description The `@stackra/devtools` panel contribution for
 *   `@stackra/state`.
 *
 *   Renders a read-only introspection view — one card per registered
 *   reactive store — inside the devtools shell. Surfaces the store
 *   name, the DI token it's bound to, and a JSON preview of the
 *   current snapshot. Registered by `StateModule.forRoot()` via
 *   `DevtoolsModule.forFeature([...])`.
 */

import { createElement, type ReactNode } from 'react';
import { ChartBarSquareIcon } from '@stackra/ui/icons/heroicon/outline';
import { Inject, Injectable, Optional } from '@stackra/container';
import {
  STATE_REGISTRY,
  type DevtoolsCategory,
  type IDevtoolsPanel,
  type IDevtoolsView,
} from '@stackra/contracts';

import { DevtoolsPanel } from '@stackra/devtools';

import type { StateRegistry } from '@/core/registries/state.registry';
import { StateDevtoolsPanelView } from './state-devtools-panel-view';

/**
 * The devtools state panel.
 *
 * @example
 * ```typescript
 * // Registered automatically inside StateModule.forRoot().
 * imports: [
 *   DevtoolsModule.forRoot(),
 *   StateModule.forRoot(),
 *   StateModule.forFeature({
 *     name: 'theme',
 *     token: THEME_STORE,
 *     initialState: { mode: 'system' },
 *   }),
 * ]
 * ```
 */
@Injectable()
@DevtoolsPanel({
  id: 'state',
  title: 'State',
  category: 'data',
  order: 40,
})
export class StateDevtoolsPanel implements IDevtoolsPanel {
  /** @inheritdoc */
  public readonly id = 'state';
  /** @inheritdoc */
  public readonly title = 'State';
  /** @inheritdoc */
  public readonly category: DevtoolsCategory = 'data';
  /** @inheritdoc */
  public readonly order = 40;
  /** @inheritdoc */
  public readonly icon: ReactNode = createElement(ChartBarSquareIcon, {
    className: 'size-4',
  });
  /** @inheritdoc */
  public readonly view: IDevtoolsView;

  /**
   * @param registry - The {@link StateRegistry} — optional so the
   *   panel resolves in apps that installed `@stackra/state` but
   *   never called `StateModule.forRoot()`. When absent the view
   *   renders an empty-state card.
   */
  public constructor(
    @Optional() @Inject(STATE_REGISTRY) private readonly registry?: StateRegistry
  ) {
    this.view = {
      type: 'component',
      render: (): ReactNode => createElement(StateDevtoolsPanelView, { registry: this.registry }),
    };
  }

  /**
   * The nav-rail badge counter — the number of stores registered via
   * `StateModule.forFeature(...)`. Returns `null` when the registry
   * isn't available or holds zero stores.
   */
  public badge(): number | null {
    // fail-soft — a broken registry must not throw here.
    try {
      const count = this.registry?.getAll().length ?? 0;
      return count > 0 ? count : null;
    } catch {
      return null;
    }
  }
}
