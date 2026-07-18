import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

import { announcementFields } from "@/modules/schemas";

const ListPage = lazy(() => import("./pages/list"));
const ShowPage = lazy(() => import("./pages/show"));

const announcementsModule: AppModule = {
  name: "announcements",
  resources: [
    {
      name: "announcements",
      list: "/announcements",
      show: "/announcements/:id",
      meta: {
        label: "Announcements",
        singularLabel: "Announcement",
        icon: "megaphone",
        groupKey: "communications",
        order: 33,
        featureKey: "announcements",
        requiredPermission: "announcements.viewAny",
        scopes: ["branch"],
        crud: "full",
        formFields: announcementFields,
        emptyState: {
          title: "No announcements yet",
          description: "Post updates so athletes and guardians stay informed.",
          actionLabel: "New announcement",
        },
        // Filter chips = the four audience buckets from the schema
        // so ops can quickly review what was sent to whom.
        filterChips: [
          {
            id: "all",
            label: "Everyone",
            filter: { field: "audience", operator: "eq", value: "all" },
            color: "accent",
          },
          {
            id: "athletes",
            label: "Athletes",
            filter: { field: "audience", operator: "eq", value: "athletes" },
            color: "accent",
          },
          {
            id: "guardians",
            label: "Guardians",
            filter: { field: "audience", operator: "eq", value: "guardians" },
            color: "accent",
          },
          {
            id: "staff",
            label: "Staff",
            filter: { field: "audience", operator: "eq", value: "staff" },
            color: "warning",
          },
        ],
        // Saved views: scheduled announcements (still in the
        // draft/queue) vs. sent (the archive). Fixture doesn't
        // carry a discrete publish state yet, so we compose on
        // `publishAt` — future dates are scheduled, past are sent.
        savedViews: [
          {
            id: "scheduled",
            label: "Scheduled",
            filters: [{ field: "publishAt", operator: "gte", value: new Date().toISOString() }],
          },
          {
            id: "sent",
            label: "Sent",
            filters: [{ field: "publishAt", operator: "lte", value: new Date().toISOString() }],
            isDefault: true,
          },
        ],
        // Announcements are recalled by title alone — the body is
        // free-form so noise > signal there.
        searchFields: ["title"],
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/announcements", tier: "protected" },
    { element: createElement(ShowPage), path: "/announcements/:id", tier: "protected" },
  ],
};

export default announcementsModule;
