/**
 * @file ai-chat.component.tsx
 * @module @stackra/ai/native/components
 * @description `AiChat` (native) — the top-level chat surface for React
 *   Native. Composes a `ScrollView` of `AiMessage` items with an
 *   `AiPrompt` composer, driven by `useAiChat`.
 *
 *   Layout mirrors the web variant: an optional header slot, a scrollable
 *   messages viewport, a streaming loader when the last message isn't
 *   yet an assistant reply, and the composer footer.
 */

import type { JSX, ReactNode } from "react";
import { ScrollView, View } from "react-native";

import { useAiChat } from "@/core/hooks/use-ai-chat";
import { AiLoader } from "../ai-loader";
import { AiMessage } from "../ai-message";
import { AiPrompt } from "../ai-prompt";

/** Props accepted by {@link AiChat}. */
export interface IAiChatProps {
  /** Persona / agent slug scoping this chat. */
  persona: string;
  /** Optional existing thread id to resume. */
  threadId?: string;
  /** Placeholder for the composer. */
  placeholder?: string;
  /** Content rendered above the messages (e.g. suggestions empty state). */
  header?: ReactNode;
  /** Content rendered inside the composer footer. */
  footer?: ReactNode;
  /** Passthrough class for composition. */
  className?: string;
}

/** A ready-to-use AI chat surface for React Native. */
export function AiChat(props: IAiChatProps): JSX.Element {
  const { persona, threadId, placeholder, header, footer, className } = props;
  const chat = useAiChat({ persona, ...(threadId !== undefined ? { threadId } : {}) });

  const isStreaming = chat.status === "streaming";
  const lastMessage = chat.messages[chat.messages.length - 1];
  const showLoader = isStreaming && lastMessage?.role !== "assistant";

  return (
    <View className={`flex-1 flex-col${className ? ` ${className}` : ""}`}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-4 pb-3 gap-3"
        keyboardShouldPersistTaps="handled"
      >
        {header ? <View className="pb-2">{header}</View> : null}
        {chat.messages.map((message, index) => {
          const isLast = index === chat.messages.length - 1;
          return (
            <AiMessage
              key={message.id}
              message={message}
              isStreaming={isStreaming && isLast && message.role === "assistant"}
              onApproveTool={chat.approveTool}
              onRejectTool={chat.rejectTool}
            />
          );
        })}
        {showLoader ? <AiLoader variant="spinner" label="Thinking…" /> : null}
      </ScrollView>

      <View className="px-3 pt-2 pb-3">
        <AiPrompt
          chat={chat}
          {...(placeholder !== undefined ? { placeholder } : {})}
          {...(footer !== undefined ? { footer } : {})}
        />
      </View>
    </View>
  );
}
