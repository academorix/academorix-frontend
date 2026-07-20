/**
 * @file overview.devtools-panel.ts
 * @module @stackra/devtools/react/panels
 * @description The built-in Overview panel — registered by
 *   `DevtoolsModule.forRoot()`.
 *
 *   Ships as `type: 'component'`; the render callback returns the
 *   `<OverviewPanel />` React component. Contribution goes through
 *   the same `@DevtoolsPanel(...)` decorator every feature-package
 *   contribution uses, so the "built-in" set has no special path.
 */

import { createElement, type ReactNode } from 'react';
import { Injectable } from '@stackra/container';
import type { DevtoolsCategory, IDevtoolsPanel, IDevtoolsView } from '@stackra/contracts';

import { DevtoolsPanel } from '@/core/decorators';
import { OverviewPanel } from '../components/overview-panel';

/**
 * The built-in Overview panel.
 *
 * @example
 * ```tsx
 * // Registered automatically by DevtoolsModule.forRoot().
 * DevtoolsModule.forRoot();
 * ```
 */
@Injectable()
@DevtoolsPanel({ id: 'overview', title: 'Overview', category: 'pinned', order: 0 })
export class OverviewDevtoolsPanel implements IDevtoolsPanel {
  /** @inheritdoc */
  public readonly id = 'overview';
  /** @inheritdoc */
  public readonly title = 'Overview';
  /** @inheritdoc */
  public readonly category: DevtoolsCategory = 'pinned';
  /** @inheritdoc */
  public readonly order = 0;

  /** @inheritdoc */
  public readonly view: IDevtoolsView = {
    type: 'component',
    // Rendering the React element inline is fine — `render()` is
    // called by the shell only when the panel is active, so we
    // don't pay the cost of mounting the OverviewPanel until the
    // user opens the panel.
    render: (): ReactNode => createElement(OverviewPanel),
  };
}
