/**
 * @file ai-chat.component.tsx
 * @module @stackra/ai/react/components
 * @description `AiChat` — the top-level chat surface. Composes
 *   HeroUI Pro's `ChatConversation` viewport with `AiMessage` items and
 *   an `AiPrompt` composer, driven by `useAiChat`.
 */

import type { JSX, ReactNode } from 'react';
import { ChatConversation } from '@stackra/ui/react';

import { useAiChat } from '@/core/hooks/use-ai-chat';
import { AiMessage } from '../ai-message';
import { AiPrompt } from '../ai-prompt';
import { AiLoader } from '../ai-loader';

/** Props accepted by {@link AiChat}. */
export interface IAiChatProps {
  /** Persona / agent slug scoping this chat. */
  persona: string;
  /** Optional existing thread id to resume. */
  threadId?: string;
  /** Placeholder text for the composer. */
  placeholder?: string;
  /** Content to render above the messages (e.g. `AiSuggestions` empty state). */
  header?: ReactNode;
  /** Content to render as the composer footer. */
  footer?: ReactNode;
  /** Optional passthrough class for the outer container. */
  className?: string;
}

/**
 * A ready-to-use AI chat surface. Consumers can drop `<AiChat persona="…" />`
 * into any page inside `<AiProvider>` and the whole conversation flow
 * wires up.
 */
export function AiChat(props: IAiChatProps): JSX.Element {
  const { persona, threadId, placeholder, header, footer, className } = props;
  const chat = useAiChat({ persona, ...(threadId !== undefined ? { threadId } : {}) });

  const isStreaming = chat.status === 'streaming';

  return (
    <div className={className}>
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <ChatConversation className="flex-1">
          <ChatConversation.Content className="mx-auto flex w-full max-w-[720px] flex-col gap-8 px-4 pb-6 pt-8">
            {header}
            {chat.messages.map((message, index) => {
              const isLast = index === chat.messages.length - 1;
              return (
                <AiMessage
                  key={message.id}
                  message={message}
                  isStreaming={isStreaming && isLast && message.role === 'assistant'}
                  onApproveTool={chat.approveTool}
                  onRejectTool={chat.rejectTool}
                />
              );
            })}
            {chat.status === 'streaming' && chat.messages.at(-1)?.role !== 'assistant' ? (
              <AiLoader variant="shimmer" label="Thinking..." />
            ) : null}
          </ChatConversation.Content>
        </ChatConversation>
        <div className="shrink-0 px-4 pb-4 pt-3">
          <AiPrompt
            chat={chat}
            {...(placeholder !== undefined ? { placeholder } : {})}
            {...(footer !== undefined ? { footer } : {})}
          />
        </div>
      </div>
    </div>
  );
}
