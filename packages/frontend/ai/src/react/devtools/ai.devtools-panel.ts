/**
 * @file ai.devtools-panel.ts
 * @module @stackra/ai/react/devtools
 * @description The `@stackra/devtools` panel contribution for
 *   `@stackra/ai`.
 *
 *   Surfaces the orchestrator status (idle / streaming / complete /
 *   error / cancelled), the active AI client identity, and a
 *   placeholder for the recent-calls history buffer (the buffer
 *   itself is a follow-up — see the panel view for the empty-state
 *   copy). Read-only — nothing here mutates the orchestrator.
 *   Registered by `AiModule.forRoot()` via
 *   `DevtoolsModule.forFeature([...])`.
 */

import { createElement, type ReactNode } from "react";
import { CpuChipIcon } from "@stackra/ui/icons/heroicon/outline";
import { Inject, Injectable, Optional } from "@stackra/container";
import { DevtoolsPanel } from "@stackra/devtools";
import {
  AI_CLIENT,
  AI_ORCHESTRATOR,
  type DevtoolsCategory,
  type IAiClient,
  type IDevtoolsPanel,
  type IDevtoolsView,
} from "@stackra/contracts";

import type { ChatOrchestrator } from "@/core/services/chat-orchestrator.service";
import { AiDevtoolsPanelView } from "./ai-devtools-panel-view";

/**
 * The devtools AI panel.
 *
 * @example
 * ```typescript
 * // Registered automatically inside AiModule.forRoot().
 * imports: [
 *   DevtoolsModule.forRoot(),
 *   WebAiModule.forRoot({ ... }),
 * ]
 * ```
 */
@Injectable()
@DevtoolsPanel({
  id: "ai",
  title: "AI",
  category: "framework",
  order: 50,
})
export class AiDevtoolsPanel implements IDevtoolsPanel {
  /** @inheritdoc */
  public readonly id = "ai";
  /** @inheritdoc */
  public readonly title = "AI";
  /** @inheritdoc */
  public readonly category: DevtoolsCategory = "framework";
  /** @inheritdoc */
  public readonly order = 50;
  /** @inheritdoc */
  public readonly icon: ReactNode = createElement(CpuChipIcon, {
    className: "size-4",
  });
  /** @inheritdoc */
  public readonly view: IDevtoolsView;

  /**
   * @param orchestrator - The {@link ChatOrchestrator} — optional so
   *   the panel resolves in apps that installed `@stackra/ai` but
   *   don't render the chat surface. When absent the view renders
   *   an empty-state card.
   * @param client - The active {@link IAiClient} — optional for the
   *   same reason. Used to display the client's class name in the
   *   summary card.
   */
  public constructor(
    @Optional() @Inject(AI_ORCHESTRATOR) private readonly orchestrator?: ChatOrchestrator,
    @Optional() @Inject(AI_CLIENT) private readonly client?: IAiClient,
  ) {
    this.view = {
      type: "component",
      render: (): ReactNode =>
        createElement(AiDevtoolsPanelView, {
          orchestrator: this.orchestrator,
          client: this.client,
        }),
    };
  }

  /**
   * The nav-rail badge counter — the depth of the orchestrator's
   * pending state. Returns `1` while a stream is in flight, `null`
   * otherwise so the badge stays hidden while idle.
   */
  public badge(): number | null {
    // fail-soft — a broken orchestrator must not throw here.
    try {
      const status = this.orchestrator?.status;
      return status === "streaming" ? 1 : null;
    } catch {
      return null;
    }
  }
}
