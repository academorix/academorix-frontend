/**
 * @file ai-message.component.tsx
 * @module @stackra/ai/native/components
 * @description `AiMessage` (native) — renders a single conversation
 *   message using HeroUI Native compound primitives via `@stackra/ui/native`.
 *
 *   User messages render inside a `Card` with the accent-tinted `default`
 *   surface variant on the trailing edge; assistant messages render on
 *   the leading edge with the muted `tertiary` variant + an `Avatar`.
 *
 *   Streaming assistant text is wrapped with `accessibilityLiveRegion="polite"`
 *   so VoiceOver / TalkBack announce incremental updates (Req 20.7 — the
 *   RN equivalent of ARIA `aria-live`).
 */

import type { JSX } from 'react';
import { View } from 'react-native';
import { Avatar, Card, Typography } from '@stackra/ui/native';
import type { IAiMessage } from '@stackra/contracts';

import { AiToolCall } from '../ai-tool-call';

/** Props accepted by {@link AiMessage}. */
export interface IAiMessageProps {
  /** The message to render. */
  message: IAiMessage;
  /** Approve handler for `RequiresAction` tool calls. */
  onApproveTool?: (toolCallId: string) => void;
  /** Reject handler for `RequiresAction` tool calls. */
  onRejectTool?: (toolCallId: string) => void;
  /** Whether the assistant response is still streaming (drives live region). */
  isStreaming?: boolean;
  /** Passthrough class for composition. */
  className?: string;
}

/** Render a single conversation message. */
export function AiMessage(props: IAiMessageProps): JSX.Element {
  const { message, onApproveTool, onRejectTool, isStreaming = false, className } = props;

  if (message.role === 'user') {
    return (
      <View className={`flex-row justify-end${className ? ` ${className}` : ''}`}>
        <Card variant="default" className="max-w-[85%]">
          <Card.Body>
            <Typography.Paragraph>{message.text}</Typography.Paragraph>
          </Card.Body>
        </Card>
      </View>
    );
  }

  return (
    <View className={`flex-row gap-3${className ? ` ${className}` : ''}`}>
      <Avatar size="sm" color="accent">
        <Avatar.Fallback>AI</Avatar.Fallback>
      </Avatar>
      <View className="flex-1 gap-2">
        <Typography.Paragraph accessibilityLiveRegion={isStreaming ? 'polite' : 'none'}>
          {message.text}
        </Typography.Paragraph>

        {message.toolCalls.length > 0 ? (
          <View className="gap-2">
            {message.toolCalls.map((call) => (
              <AiToolCall
                key={call.toolCallId}
                toolCall={call}
                {...(onApproveTool ? { onApprove: onApproveTool } : {})}
                {...(onRejectTool ? { onReject: onRejectTool } : {})}
              />
            ))}
          </View>
        ) : null}

        {message.sources && message.sources.length > 0 ? (
          <Card variant="tertiary">
            <Card.Body>
              <Typography.Paragraph type="body-sm" weight="semibold">
                Sources
              </Typography.Paragraph>
              <View className="gap-1 mt-1">
                {message.sources.map((source) => (
                  <Typography.Paragraph
                    key={source.id}
                    type="body-xs"
                    color="muted"
                    numberOfLines={2}
                  >
                    {source.title}
                    {source.url ? ` — ${source.url}` : ''}
                  </Typography.Paragraph>
                ))}
              </View>
            </Card.Body>
          </Card>
        ) : null}
      </View>
    </View>
  );
}
