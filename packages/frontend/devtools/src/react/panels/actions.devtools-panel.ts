/**
 * @file actions.devtools-panel.ts
 * @module @stackra/devtools/react/panels
 * @description The built-in Actions panel — registered by
 *   `DevtoolsModule.forRoot()`.
 *
 *   Ships as `type: 'component'` (not `'action'`) so we can render
 *   a richer UI that distinguishes "action unavailable — package
 *   not installed" from "action available". The inner React
 *   component uses `useOptionalInject` for the CACHE_MANAGER /
 *   QUEUE_MANAGER / SCOPE_SERVICE / STATE_REGISTRY / DISCOVERY_SERVICE
 *   optional dependencies.
 */

import { createElement, type ReactNode } from 'react';
import { Injectable } from '@stackra/container';
import type { DevtoolsCategory, IDevtoolsPanel, IDevtoolsView } from '@stackra/contracts';

import { DevtoolsPanel } from '@/core/decorators';
import { ActionsPanel } from '../components/actions-panel';

/**
 * The built-in Actions panel.
 */
@Injectable()
@DevtoolsPanel({ id: 'actions', title: 'Actions', category: 'pinned', order: 1 })
export class ActionsDevtoolsPanel implements IDevtoolsPanel {
  /** @inheritdoc */
  public readonly id = 'actions';
  /** @inheritdoc */
  public readonly title = 'Actions';
  /** @inheritdoc */
  public readonly category: DevtoolsCategory = 'pinned';
  /** @inheritdoc */
  public readonly order = 1;

  /** @inheritdoc */
  public readonly view: IDevtoolsView = {
    type: 'component',
    render: (): ReactNode => createElement(ActionsPanel),
  };
}
