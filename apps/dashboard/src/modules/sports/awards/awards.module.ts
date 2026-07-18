import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

import { awardFields } from "@/modules/schemas";

const ListPage = lazy(() => import("./pages/list"));
const ShowPage = lazy(() => import("./pages/show"));

const awardsModule: AppModule = {
  name: "awards",
  resources: [
    {
      name: "awards",
      list: "/awards",
      show: "/awards/:id",
      meta: {
        label: "Awards",
        singularLabel: "Award",
        icon: "medal",
        groupKey: "records",
        order: 35,
        featureKey: "awards",
        requiredPermission: "awards.viewAny",
        crud: "full",
        formFields: awardFields,
        emptyState: {
          title: "No awards yet",
          description: "Record athlete-of-the-week and season MVP awards.",
          actionLabel: "New award",
        },
        // Saved views: awarded vs. pending. Directors publish
        // awarded ones on the parents' portal; pending ones are
        // shortlists that still need approval.
        savedViews: [
          {
            id: "awarded",
            label: "Awarded",
            filters: [{ field: "status.text", operator: "eq", value: "Awarded" }],
            isDefault: true,
          },
          {
            id: "pending",
            label: "Pending",
            filters: [{ field: "status.text", operator: "eq", value: "Pending" }],
          },
        ],
        // Filter chips = medal / certificate / badge kinds. The
        // fixture doesn't carry an explicit `kind` field yet, so
        // we `contains`-match the award name vocabulary — chips
        // stay useful once tenants populate a `kind` field, and
        // don't break when they haven't.
        filterChips: [
          {
            id: "medal",
            label: "Medal",
            filter: { field: "name", operator: "contains", value: "medal" },
            color: "success",
          },
          {
            id: "certificate",
            label: "Certificate",
            filter: { field: "name", operator: "contains", value: "certificate" },
            color: "accent",
          },
          {
            id: "badge",
            label: "Badge",
            filter: { field: "name", operator: "contains", value: "badge" },
            color: "warning",
          },
        ],
        // Award lookup by title (e.g. "Swimmer of the month") or
        // by recipient athlete — coaches recall one or the other.
        searchFields: ["name", "recipient", "sport"],
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/awards", tier: "protected" },
    { element: createElement(ShowPage), path: "/awards/:id", tier: "protected" },
  ],
};

export default awardsModule;
