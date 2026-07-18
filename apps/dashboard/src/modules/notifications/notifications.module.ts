import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const ListPage = lazy(() => import("./pages/list"));
const ExtraPage0 = lazy(() => import("./pages/extra-0"));

const notificationsModule: AppModule = {
  name: "notifications",
  resources: [
    {
      name: "notifications",
      list: "/notifications",
      meta: {
        label: "Notifications",
        icon: "bell",
        groupKey: "overview",
        order: 12,
        featureKey: "notifications",
        requiredPermission: "notification.view",
        // `G N` — notifications. Previously `G I`, which collided with
        // `integrations`; the registry warned "First binding wins" and only
        // one of the two shortcut was reachable. Renamed to `G N` so both
        // resources keep a hotkey.
        shortcuts: { navigate: "G N" },
        crud: "list-only",
        // Filter chips = notification kind buckets. Users routinely
        // pivot to "just payments" or "just messages" when triaging
        // a busy inbox.
        filterChips: [
          {
            id: "payment",
            label: "Payment",
            filter: { field: "kind", operator: "eq", value: "Payment" },
            color: "success",
          },
          {
            id: "attendance",
            label: "Attendance",
            filter: { field: "kind", operator: "eq", value: "Attendance" },
            color: "accent",
          },
          {
            id: "message",
            label: "Message",
            filter: { field: "kind", operator: "eq", value: "Message" },
            color: "warning",
          },
          {
            id: "system",
            label: "System",
            filter: { field: "kind", operator: "eq", value: "System" },
            color: "default",
          },
        ],
        // Notifications are picked up by their summary line — the
        // recipient is the second axis when tenant admins triage.
        searchFields: ["name", "recipient"],
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/notifications", tier: "protected" },
    { element: createElement(ExtraPage0), path: "/notifications/preferences", tier: "protected" },
  ],
};

export default notificationsModule;
