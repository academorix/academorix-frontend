/**
 * @file actions.native-devtools-panel.ts
 * @module @stackra/devtools/native/panels
 * @description The built-in Actions panel for native — registered
 *   by the native `DevtoolsProvider` on mount.
 *
 *   Ships as `type: 'component'` — the inner React Native
 *   component (`<ActionsPanel />`) uses `useOptionalInject` for
 *   every optional manager it may fan out to (cache / queue /
 *   scope / state / discovery).
 */

import { createElement, type ReactNode } from "react";
import type { DevtoolsCategory, IDevtoolsPanel, IDevtoolsView } from "@stackra/contracts";

import { ActionsPanel } from "../components/actions-panel";

/**
 * The built-in Actions panel (native).
 */
export class ActionsNativeDevtoolsPanel implements IDevtoolsPanel {
  /** @inheritdoc */
  public readonly id = "actions";
  /** @inheritdoc */
  public readonly title = "Actions";
  /** @inheritdoc */
  public readonly category: DevtoolsCategory = "pinned";
  /** @inheritdoc */
  public readonly order = 1;

  /** @inheritdoc */
  public readonly view: IDevtoolsView = {
    type: "component",
    render: (): ReactNode => createElement(ActionsPanel),
  };
}
