/**
 * @file overview.native-devtools-panel.ts
 * @module @stackra/devtools/native/panels
 * @description The built-in Overview panel for native — registered
 *   by the native `DevtoolsProvider` on mount.
 *
 *   Ships as `type: 'component'`; the render callback returns the
 *   `<OverviewPanel />` React Native component.
 */

import { createElement, type ReactNode } from "react";
import type { DevtoolsCategory, IDevtoolsPanel, IDevtoolsView } from "@stackra/contracts";

import { OverviewPanel } from "../components/overview-panel";

/**
 * The built-in Overview panel (native).
 */
export class OverviewNativeDevtoolsPanel implements IDevtoolsPanel {
  /** @inheritdoc */
  public readonly id = "overview";
  /** @inheritdoc */
  public readonly title = "Overview";
  /** @inheritdoc */
  public readonly category: DevtoolsCategory = "pinned";
  /** @inheritdoc */
  public readonly order = 0;

  /** @inheritdoc */
  public readonly view: IDevtoolsView = {
    type: "component",
    // Deferred: render is called by the shell only when the panel
    // is active, so mounting the OverviewPanel is deferred to
    // then.
    render: (): ReactNode => createElement(OverviewPanel),
  };
}
