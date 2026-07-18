import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const ListPage = lazy(() => import("./pages/list"));
const ShowPage = lazy(() => import("./pages/show"));

const messagingModule: AppModule = {
  name: "messaging",
  resources: [
    {
      name: "conversations",
      list: "/conversations",
      show: "/conversations/:id",
      meta: {
        label: "Conversations",
        singularLabel: "Conversation",
        icon: "comments",
        groupKey: "communications",
        order: 34,
        featureKey: "messaging",
        requiredPermission: "conversations.viewAny",
        scopes: ["branch"],
        crud: "read-only",
        emptyState: {
          title: "No conversations",
          description: "Direct messages and channels appear here as they are created.",
        },
        // Saved views: an inbox / sent split matches how every
        // messaging surface (Gmail / Front / Intercom) is scanned;
        // `unread > 0` maps to the classic "Inbox" view and its
        // absence to sent-and-quiet threads.
        savedViews: [
          {
            id: "inbox",
            label: "Inbox",
            filters: [{ field: "unread", operator: "gte", value: 1 }],
            isDefault: true,
          },
          { id: "sent", label: "Sent", filters: [{ field: "unread", operator: "eq", value: 0 }] },
        ],
        // Filter chips = triage state. `Unread` mirrors the inbox
        // saved view (chip stack is additive with search); the
        // `status.text` chips pull the two other high-signal
        // states — starred / archived would land once the schema
        // grows them.
        filterChips: [
          {
            id: "unread",
            label: "Unread",
            filter: { field: "unread", operator: "gte", value: 1 },
            color: "accent",
          },
          {
            id: "open",
            label: "Open",
            filter: { field: "status.text", operator: "eq", value: "Open" },
            color: "warning",
          },
          {
            id: "replied",
            label: "Replied",
            filter: { field: "status.text", operator: "eq", value: "Replied" },
            color: "success",
          },
        ],
        // Conversations are picked up by counterparty name or by
        // subject line — one search hits both so a support agent
        // can type either.
        searchFields: ["name", "subject", "channel"],
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/conversations", tier: "protected" },
    { element: createElement(ShowPage), path: "/conversations/:id", tier: "protected" },
  ],
};

export default messagingModule;
