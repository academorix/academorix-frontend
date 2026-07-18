/**
 * @file scope.devtools-panel.ts
 * @module @stackra/scope/react/devtools
 * @description The `@stackra/devtools` panel contribution for
 *   `@stackra/scope`.
 *
 *   Reads the injected {@link ScopeService} to surface the active
 *   scope context (owner / level / entity / path) and the switchable
 *   scope tree. Read-only — switching / emulating happens elsewhere
 *   (the `<ScopeSwitcher>` in the app shell), not from devtools.
 *   Registered by `ScopeModule.forRoot()` via
 *   `DevtoolsModule.forFeature([...])`.
 */

import { createElement, type ReactNode } from 'react';
import { RectangleStackIcon } from '@stackra/ui/icons/heroicon/outline';
import { Inject, Injectable, Optional } from '@stackra/container';
import { DevtoolsPanel } from '@stackra/devtools';
import {
  SCOPE_SERVICE,
  type DevtoolsCategory,
  type IDevtoolsPanel,
  type IDevtoolsView,
} from '@stackra/contracts';

import type { ScopeService } from '@/core/services/scope.service';
import { ScopeDevtoolsPanelView } from './scope-devtools-panel-view';

/**
 * The devtools scope panel.
 *
 * @example
 * ```typescript
 * // Registered automatically inside ScopeModule.forRoot().
 * imports: [
 *   DevtoolsModule.forRoot(),
 *   ScopeModule.forRoot({ dataSource, initialScope }),
 * ]
 * ```
 */
@Injectable()
@DevtoolsPanel({
  id: 'scope',
  title: 'Scope',
  category: 'framework',
  order: 30,
})
export class ScopeDevtoolsPanel implements IDevtoolsPanel {
  /** @inheritdoc */
  public readonly id = 'scope';
  /** @inheritdoc */
  public readonly title = 'Scope';
  /** @inheritdoc */
  public readonly category: DevtoolsCategory = 'framework';
  /** @inheritdoc */
  public readonly order = 30;
  /** @inheritdoc */
  public readonly icon: ReactNode = createElement(RectangleStackIcon, {
    className: 'size-4',
  });
  /** @inheritdoc */
  public readonly view: IDevtoolsView;

  /**
   * @param service - The `ScopeService` — optional so the panel resolves
   *   even in an app that imported `DevtoolsModule.forFeature([ScopeDevtoolsPanel])`
   *   without wiring the scope service. When absent, the view renders
   *   an empty-state card.
   */
  public constructor(@Optional() @Inject(SCOPE_SERVICE) private readonly service?: ScopeService) {
    this.view = {
      type: 'component',
      render: (): ReactNode => createElement(ScopeDevtoolsPanelView, { service: this.service }),
    };
  }

  /**
   * The nav-rail badge counter — the depth of the active scope's
   * `path` (self → root). Returns `null` when no scope is resolved
   * so the badge stays hidden until there's something to show.
   */
  public badge(): number | null {
    // fail-soft — a misshapen scope snapshot must not throw here.
    try {
      const scope = this.service?.getScope();
      const depth = scope?.path.length ?? 0;
      return depth > 0 ? depth : null;
    } catch {
      return null;
    }
  }
}
