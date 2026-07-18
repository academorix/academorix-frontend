/**
 * @file list.tsx
 * @module modules/messaging/pages/list
 *
 * @description
 * Conversations list (scoped by branch) — threads with subject, participant
 * count, and last-activity time. Per-row show action opens the thread.
 */

import type { Conversation } from "@/modules/messaging/messaging.types";
import type { DataGridColumn } from "@stackra/ui/react";
import type { ReactNode } from "react";

import { ListView, ResourceDataGrid, ShowButton } from "@/components/refine";
import { formatDateTime } from "@/lib/format";

/** DataGrid columns for the conversations list. */
const COLUMNS: DataGridColumn<Conversation>[] = [
  {
    id: "subject",
    header: "Conversation",
    isRowHeader: true,
    allowsSorting: true,
    minWidth: 260,
    cell: (conversation) => <span className="font-medium">{conversation.subject}</span>,
  },
  {
    id: "participant_count",
    header: "Participants",
    cell: (conversation) => conversation.participant_count,
  },
  {
    id: "last_message_at",
    header: "Last activity",
    allowsSorting: true,
    minWidth: 170,
    cell: (conversation) => formatDateTime(conversation.last_message_at),
  },
  {
    id: "actions",
    header: "",
    align: "end",
    minWidth: 80,
    cell: (conversation) => (
      <div className="flex justify-end">
        <ShowButton
          isIconOnly
          aria-label="Open conversation"
          recordItemId={conversation.id}
          resource="conversations"
          size="sm"
          variant="ghost"
        />
      </div>
    ),
  },
];

/** The conversations list page. */
export default function ConversationList(): ReactNode {
  return (
    <ListView resource="conversations" title="Messaging">
      <ResourceDataGrid<Conversation>
        ariaLabel="Conversations"
        columns={COLUMNS}
        contentClassName="min-w-[640px]"
        initialSorters={[{ field: "last_message_at", order: "desc" }]}
        resource="conversations"
      />
    </ListView>
  );
}
