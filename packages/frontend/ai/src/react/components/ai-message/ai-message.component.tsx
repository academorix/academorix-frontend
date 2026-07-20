/**
 * @file ai-message.component.tsx
 * @module @stackra/ai/react/components
 * @description `AiMessage` — renders a single conversation message
 *   (user or assistant) using HeroUI Pro's `ChatMessage` compound.
 *   Assistant messages render markdown, tool calls, and sources; user
 *   messages render inside a bubble.
 *
 *   Streaming assistant text is placed inside an `aria-live` region so
 *   assistive technology hears incremental updates (Req 20.7).
 */

import type { JSX } from "react";
import { ChatMessage, ChatMessageActions } from "@stackra/ui/react";
import type { IAiMessage } from "@stackra/contracts";

import { AiMarkdown } from "../ai-markdown";
import { AiSources } from "../ai-sources";
import { AiToolCall } from "../ai-tool-call";

/** Props accepted by {@link AiMessage}. */
export interface IAiMessageProps {
  /** The message to render. */
  message: IAiMessage;
  /** Called when the user approves a `RequiresAction` tool call. */
  onApproveTool?: (toolCallId: string) => void;
  /** Called when the user rejects a `RequiresAction` tool call. */
  onRejectTool?: (toolCallId: string) => void;
  /** Whether the assistant response is still streaming (drives aria-live). */
  isStreaming?: boolean;
  /** Optional passthrough class. */
  className?: string;
}

/** Render a single conversation message. */
export function AiMessage(props: IAiMessageProps): JSX.Element {
  const { message, onApproveTool, onRejectTool, isStreaming = false, className } = props;

  if (message.role === "user") {
    return (
      <ChatMessage.User className={className}>
        <ChatMessage.Bubble>
          <ChatMessage.Content>{message.text}</ChatMessage.Content>
        </ChatMessage.Bubble>
      </ChatMessage.User>
    );
  }

  // Assistant / system role render as the assistant lane.
  return (
    <ChatMessage.Assistant className={className}>
      <ChatMessage.Avatar show alt="Assistant" fallback="AI" />
      <ChatMessage.Body>
        <ChatMessage.Content aria-live={isStreaming ? "polite" : undefined} aria-atomic="false">
          <AiMarkdown>{message.text}</AiMarkdown>
        </ChatMessage.Content>

        {message.toolCalls.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {message.toolCalls.map((call) => (
              <AiToolCall
                key={call.toolCallId}
                toolCall={call}
                {...(onApproveTool ? { onApprove: onApproveTool } : {})}
                {...(onRejectTool ? { onReject: onRejectTool } : {})}
              />
            ))}
          </div>
        )}

        {message.sources && message.sources.length > 0 && (
          <div className="mt-3">
            <AiSources sources={message.sources} />
          </div>
        )}

        {!isStreaming && (
          <ChatMessageActions>
            <ChatMessageActions.Copy aria-label="Copy" tooltip="Copy" />
            <ChatMessageActions.ThumbsUp aria-label="Good response" tooltip="Good response" />
            <ChatMessageActions.ThumbsDown aria-label="Bad response" tooltip="Bad response" />
          </ChatMessageActions>
        )}
      </ChatMessage.Body>
    </ChatMessage.Assistant>
  );
}
