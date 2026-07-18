/**
 * @file show.tsx
 * @module modules/messaging/pages/show
 *
 * @description
 * Conversation thread — the subject plus the ordered messages (sender, body,
 * time). Messages are loaded from the `messages` resource filtered by the
 * conversation id.
 */

import { Avatar, Card, Spinner } from "@stackra/ui/react";
import { useList, useShow } from "@refinedev/core";

import type { Conversation, Message } from "@/modules/messaging/messaging.types";
import type { ReactNode } from "react";

import { ShowView } from "@/components/refine";
import { formatDateTime } from "@/lib/format";

/** Derives initials from a display name for the avatar fallback. */
function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** The conversation thread page. */
export default function ConversationShow(): ReactNode {
  const { result: conversation, query } = useShow<Conversation>({ resource: "conversations" });
  const { result: messagesResult } = useList<Message>({
    resource: "messages",
    pagination: { mode: "off" },
    sorters: [{ field: "sent_at", order: "asc" }],
    filters: [{ field: "conversation_id", operator: "eq", value: conversation?.id ?? "" }],
    queryOptions: { enabled: Boolean(conversation?.id) },
  });
  const messages = messagesResult?.data ?? [];

  if (query.isLoading || !conversation) {
    return (
      <ShowView resource="conversations">
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      </ShowView>
    );
  }

  return (
    <ShowView resource="conversations">
      <Card>
        <Card.Header>
          <Card.Title>{conversation.subject}</Card.Title>
          <Card.Description>{conversation.participant_count} participants</Card.Description>
        </Card.Header>
        <Card.Content>
          <ul className="flex flex-col gap-4">
            {messages.map((message) => (
              <li key={message.id} className="flex gap-3">
                <Avatar className="size-8 shrink-0">
                  <Avatar.Fallback>{initials(message.sender_name)}</Avatar.Fallback>
                </Avatar>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {message.sender_name}
                    </span>
                    <span className="text-xs text-muted">{formatDateTime(message.sent_at)}</span>
                  </div>
                  <p className="text-sm text-foreground">{message.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card.Content>
      </Card>
    </ShowView>
  );
}
