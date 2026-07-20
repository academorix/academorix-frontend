/**
 * @file ai-prompt.component.tsx
 * @module @stackra/ai/react/components
 * @description `AiPrompt` — the message composer. Wraps HeroUI Pro's
 *   `PromptInput` and drives it from a `useAiChat` result so its
 *   send/stop states mirror the orchestrator's `status`.
 *
 *   Submission is gated by `canSubmit` (Req 24.6) — when the connection
 *   is not ready the input remains visible but submissions no-op and
 *   the footer surfaces the reason.
 */

import type { JSX, ReactNode } from 'react';
import { PromptInput } from '@stackra/ui/react';

import type { IUseAiChatResult } from '@/core/hooks/use-ai-chat';
import type { OrchestratorStatus } from '@/core/services/chat-orchestrator.service';

/** Props accepted by {@link AiPrompt}. */
export interface IAiPromptProps {
  /** The value returned by `useAiChat(...)`. */
  chat: IUseAiChatResult;
  /** Placeholder for the textarea. */
  placeholder?: string;
  /** Footer content (e.g. disclaimer). */
  footer?: ReactNode;
  /** Optional passthrough class. */
  className?: string;
}

/** Map orchestrator status to `PromptInput`'s status union. */
function mapStatus(status: OrchestratorStatus): 'ready' | 'submitted' | 'streaming' | 'error' {
  switch (status) {
    case 'streaming':
      return 'streaming';
    case 'error':
      return 'error';
    case 'complete':
    case 'idle':
    case 'cancelled':
    default:
      return 'ready';
  }
}

/** The chat composer, bound to `useAiChat`. */
export function AiPrompt(props: IAiPromptProps): JSX.Element {
  const { chat, placeholder = 'Message the assistant...', footer, className } = props;

  const status = mapStatus(chat.status);
  const disabledReason = !chat.connection.isConnected ? chat.connection.reason?.message : undefined;

  return (
    <PromptInput
      className={className}
      value={chat.input}
      onValueChange={chat.setInput}
      onSubmit={() => void chat.send()}
      onStop={() => void chat.stop()}
      status={status}
      isDisabled={!chat.connection.isConnected}
    >
      <PromptInput.Shell>
        <PromptInput.Content>
          <PromptInput.TextArea placeholder={placeholder} />
        </PromptInput.Content>
        <PromptInput.Toolbar>
          <PromptInput.ToolbarEnd>
            <PromptInput.Send />
          </PromptInput.ToolbarEnd>
        </PromptInput.Toolbar>
      </PromptInput.Shell>
      {(disabledReason ?? footer) ? (
        <PromptInput.Footer>{disabledReason ?? footer}</PromptInput.Footer>
      ) : null}
    </PromptInput>
  );
}
