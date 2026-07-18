/**
 * @file ai-prompt.component.tsx
 * @module @stackra/ai/native/components
 * @description `AiPrompt` (native) — the RN composer, built on HeroUI
 *   Native `TextField` + `TextArea` + `Button`. Mirrors the web
 *   `AiPrompt`'s API: bound to `useAiChat`, disabled while the
 *   connection is not ready (Req 24.6), and swaps its trailing button
 *   between "Send" and "Stop" based on orchestrator status.
 */

import type { JSX, ReactNode } from 'react';
import { View } from 'react-native';
import { Button, Description, TextArea, TextField, Typography } from '@stackra/ui/native';

import type { IUseAiChatResult } from '@/core/hooks/use-ai-chat';

/** Props accepted by {@link AiPrompt}. */
export interface IAiPromptProps {
  /** The value returned by `useAiChat(...)`. */
  chat: IUseAiChatResult;
  /** Placeholder for the input. */
  placeholder?: string;
  /** Footer node (e.g. disclaimer). */
  footer?: ReactNode;
  /** Passthrough class for composition. */
  className?: string;
}

/** The chat composer, bound to `useAiChat`. */
export function AiPrompt(props: IAiPromptProps): JSX.Element {
  const { chat, placeholder = 'Message the assistant…', footer, className } = props;
  const isStreaming = chat.status === 'streaming';
  const disabledReason = !chat.connection.isConnected ? chat.connection.reason?.message : undefined;
  const canSubmit = chat.canSubmit;

  const onPress = (): void => {
    if (isStreaming) {
      void chat.stop();
      return;
    }
    if (!canSubmit) return;
    void chat.send();
  };

  return (
    <View className={`gap-2${className ? ` ${className}` : ''}`}>
      <TextField isDisabled={!!disabledReason}>
        <View className="flex-row items-end gap-2">
          <View className="flex-1">
            <TextArea
              value={chat.input}
              onChangeText={chat.setInput}
              placeholder={placeholder}
              variant="secondary"
              blurOnSubmit={false}
              accessibilityLabel={placeholder}
            />
          </View>
          <Button
            size="md"
            variant={isStreaming ? 'danger' : 'primary'}
            isDisabled={!isStreaming && !canSubmit}
            onPress={onPress}
          >
            <Button.Label>{isStreaming ? 'Stop' : 'Send'}</Button.Label>
          </Button>
        </View>
        {disabledReason ? (
          <Description className="text-danger">{disabledReason}</Description>
        ) : null}
      </TextField>

      {!disabledReason && footer ? (
        typeof footer === 'string' ? (
          <Typography type="body-xs" color="muted">
            {footer}
          </Typography>
        ) : (
          <View>{footer}</View>
        )
      ) : null}
    </View>
  );
}
