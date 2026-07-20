/**
 * @file ai-thread-list.component.tsx
 * @module @stackra/ai/native/components
 * @description `AiThreadList` (native) — sidebar-friendly conversation
 *   list built on HeroUI Native `Card` + `PressableFeedback` + typography
 *   primitives via `@stackra/ui/native`. Driven by `useAiThreads`
 *   (Req 17.3, 17.4).
 */

import type { JSX } from "react";
import { ScrollView, View } from "react-native";
import { Card, PressableFeedback, Typography } from "@stackra/ui/native";

import { useAiThreads } from "@/core/hooks/use-ai-threads";

/** Props accepted by {@link AiThreadList}. */
export interface IAiThreadListProps {
  /** Compact density for narrow sidebars. */
  compact?: boolean;
  /** Accessibility label. */
  ariaLabel?: string;
  /** Passthrough class for composition. */
  className?: string;
}

/** A sidebar-friendly list of conversation threads. */
export function AiThreadList(props: IAiThreadListProps): JSX.Element {
  const { compact = false, ariaLabel = "Recent conversations", className } = props;
  const { threads, activeId, select } = useAiThreads();

  return (
    <ScrollView
      className={`flex-1${className ? ` ${className}` : ""}`}
      contentContainerClassName={compact ? "py-2 gap-1" : "py-2 gap-2"}
      accessibilityLabel={ariaLabel}
    >
      {threads.map((thread) => {
        const isActive = thread.threadId === activeId;
        return (
          <PressableFeedback
            key={thread.threadId}
            onPress={() => select(thread.threadId)}
            accessibilityRole="button"
            accessibilityLabel={`${thread.title}. ${thread.preview}`}
            accessibilityState={{ selected: isActive }}
          >
            <Card variant={isActive ? "secondary" : "transparent"}>
              <Card.Body>
                <View className="flex-row items-center justify-between gap-2">
                  <Typography type="body-sm" weight="semibold" truncate className="flex-1">
                    {thread.title}
                  </Typography>
                  <Typography type="body-xs" color="muted">
                    {formatMeta(thread.updatedAt)}
                  </Typography>
                </View>
                <Typography
                  type="body-xs"
                  color="muted"
                  numberOfLines={compact ? 1 : 2}
                  className="mt-0.5"
                >
                  {thread.preview}
                </Typography>
              </Card.Body>
            </Card>
          </PressableFeedback>
        );
      })}
    </ScrollView>
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
