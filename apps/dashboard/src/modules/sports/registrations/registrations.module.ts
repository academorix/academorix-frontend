import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const ListPage = lazy(() => import("./pages/list"));
const ShowPage = lazy(() => import("./pages/show"));

const registrationsModule: AppModule = {
  name: "registrations",
  resources: [
    {
      name: "registrations",
      list: "/registrations",
      show: "/registrations/:id",
      meta: {
        label: "Registrations",
        singularLabel: "Registration",
        icon: "list-check",
        groupKey: "records",
        order: 13,
        featureKey: "registrations",
        requiredPermission: "registrations.viewAny",
        scopes: ["branch", "season"],
        crud: "read-only",
        emptyState: {
          title: "No registrations yet",
          description: "Registrations flow in from public sign-up and reception intake.",
        },
        // Saved views: registrations that need staff attention
        // (active) vs. the historical archive. `isActive` is the
        // canonical lifecycle flag across the fixture.
        savedViews: [
          {
            id: "active",
            label: "Active",
            filters: [{ field: "isActive", operator: "eq", value: true }],
            isDefault: true,
          },
          {
            id: "completed",
            label: "Completed",
            filters: [{ field: "isActive", operator: "eq", value: false }],
          },
        ],
        // Filter chips = registration status buckets. `Trial` is
        // the paid-follow-up funnel; `Waitlisted` is capacity ops;
        // `Confirmed` is the healthy default.
        filterChips: [
          {
            id: "confirmed",
            label: "Confirmed",
            filter: { field: "status.text", operator: "eq", value: "Confirmed" },
            color: "success",
          },
          {
            id: "trial",
            label: "Trial",
            filter: { field: "status.text", operator: "eq", value: "Trial" },
            color: "accent",
          },
          {
            id: "waitlisted",
            label: "Waitlisted",
            filter: { field: "status.text", operator: "eq", value: "Waitlisted" },
            color: "warning",
          },
        ],
        // Reception picks a registration by athlete name most of
        // the time; team + sport + branch keep the query useful
        // when they only remember the squad.
        searchFields: ["athlete", "team", "sport", "branch"],
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/registrations", tier: "protected" },
    { element: createElement(ShowPage), path: "/registrations/:id", tier: "protected" },
  ],
};

export default registrationsModule;
