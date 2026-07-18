/**
 * @file messaging.module.tsx
 * @module modules/messaging
 *
 * @description
 * The Messaging module — in-app conversations between staff and members. A list
 * of threads plus a read thread view, scoped by branch.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §16.1 "Messaging"
 */

import { ChatBubbleLeftRightIcon } from "@stackra/ui/icons/heroicon/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const ConversationListPage = lazy(() => import("@/modules/messaging/pages/list"));
const ConversationShowPage = lazy(() => import("@/modules/messaging/pages/show"));

/** The Messaging feature module. */
const messagingModule: AppModule = {
  name: "messaging",
  resources: [
    {
      name: "conversations",
      list: "/conversations",
      show: "/conversations/:id",
      meta: {
        label: "Messaging",
        icon: ChatBubbleLeftRightIcon,
        featureKey: "conversations",
        requiredPermission: "conversations.viewAny",
        order: 34,
        scopedBy: ["branch"],
        groupKey: "operations",
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/conversations", element: createElement(ConversationListPage) },
    { tier: "protected", path: "/conversations/:id", element: createElement(ConversationShowPage) },
  ],
};

export default messagingModule;
