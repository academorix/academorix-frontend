import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

import { facilityFields } from "@/modules/schemas";

const ListPage = lazy(() => import("./pages/list"));
const ShowPage = lazy(() => import("./pages/show"));

const facilitiesModule: AppModule = {
  name: "facilities",
  resources: [
    {
      name: "facilities",
      list: "/facilities",
      show: "/facilities/:id",
      meta: {
        label: "Facilities",
        singularLabel: "Facility",
        // `house` — physical buildings; `building` isn't a Gravity
        // UI token. Branches use `map-pin` so the two stay distinct.
        icon: "house",
        groupKey: "schedule",
        order: 15,
        featureKey: "facilities",
        requiredPermission: "facilities.viewAny",
        scopes: ["branch"],
        shortcuts: { navigate: "G F" },
        crud: "full",
        formFields: facilityFields,
        emptyState: {
          title: "No facilities yet",
          description: "Register your pitches, courts, and studios so sessions can be booked.",
          actionLabel: "New facility",
        },
        savedViews: [
          {
            id: "indoor",
            label: "Indoor",
            filters: [{ field: "indoor", operator: "eq", value: true }],
          },
          {
            id: "outdoor",
            label: "Outdoor",
            filters: [{ field: "indoor", operator: "eq", value: false }],
          },
        ],
        // Facilities are recalled by name ("Pool 2"), type
        // ("Studio"), or branch when a coach is looking across
        // multiple sites.
        searchFields: ["name", "type", "branch"],
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/facilities", tier: "protected" },
    { element: createElement(ShowPage), path: "/facilities/:id", tier: "protected" },
  ],
};

export default facilitiesModule;
