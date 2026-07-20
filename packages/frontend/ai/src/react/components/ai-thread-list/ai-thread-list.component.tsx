/**
 * @file ai-thread-list.component.tsx
 * @module @stackra/ai/react/components
 * @description `AiThreadList` — conversation-list sidebar composed on
 *   HeroUI Pro's `ChatListView`. Driven by `useAiThreads` (Req 17.3, 17.4).
 */

import type { JSX } from "react";
import { ChatListView } from "@stackra/ui/react";

import { useAiThreads } from "@/core/hooks/use-ai-threads";

/** Props accepted by {@link AiThreadList}. */
export interface IAiThreadListProps {
  /** Compact density for narrow sidebars. */
  compact?: boolean;
  /** Optional passthrough class. */
  className?: string;
  /** aria-label. */
  ariaLabel?: string;
}

/** A sidebar-friendly thread list. */
export function AiThreadList(props: IAiThreadListProps): JSX.Element {
  const { compact = false, className, ariaLabel = "Recent conversations" } = props;
  const { threads, activeId, select } = useAiThreads();

  return (
    <ChatListView
      aria-label={ariaLabel}
      className={className}
      items={threads}
      density={compact ? "compact" : undefined}
    >
      {(thread) => (
        <ChatListView.Item
          id={thread.threadId}
          textValue={`${thread.title} ${thread.preview}`}
          data-selected={activeId === thread.threadId || undefined}
          onAction={() => select(thread.threadId)}
        >
          <ChatListView.ItemContent>
            <ChatListView.Text>
              <ChatListView.Title>{thread.title}</ChatListView.Title>
              <ChatListView.Preview>{thread.preview}</ChatListView.Preview>
            </ChatListView.Text>
            <ChatListView.Meta>{formatMeta(thread.updatedAt)}</ChatListView.Meta>
          </ChatListView.ItemContent>
        </ChatListView.Item>
      )}
    </ChatListView>
  );
}

function formatMeta(timestamp: number): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
