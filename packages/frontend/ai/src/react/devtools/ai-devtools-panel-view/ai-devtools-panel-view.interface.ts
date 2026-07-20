/**
 * @file ai-devtools-panel-view.interface.ts
 * @module @stackra/ai/react/devtools
 * @description Props interface for {@link AiDevtoolsPanelView} — the
 *   React body of the `@stackra/devtools` AI panel.
 */

import type { IAiClient } from '@stackra/contracts';

import type { ChatOrchestrator } from '@/core/services/chat-orchestrator.service';

/**
 * Props accepted by {@link AiDevtoolsPanelView}.
 */
export interface AiDevtoolsPanelViewProps {
  /**
   * The {@link ChatOrchestrator} — optional so the view renders an
   * empty state in apps that don't render the chat surface. When
   * present, the view subscribes to its status changes.
   */
  readonly orchestrator?: ChatOrchestrator;

  /**
   * The active {@link IAiClient} — optional for the same reason as
   * `orchestrator`. Used to surface the client's class name.
   */
  readonly client?: IAiClient;
}
