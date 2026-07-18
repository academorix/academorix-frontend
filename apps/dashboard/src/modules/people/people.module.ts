import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const ListPage = lazy(() => import("./pages/list"));

const peopleModule: AppModule = {
  name: "people",
  resources: [
    {
      name: "people",
      list: "/people",
      meta: {
        label: "People",
        singularLabel: "Person",
        icon: "person",
        groupKey: "people",
        order: 45,
        featureKey: "people",
        requiredPermission: "people.viewAny",
        crud: "list-only",
        emptyState: {
          title: "No people yet",
          description: "Global identity view — union of athletes, coaches, staff, and guardians.",
        },
        // WHY: `people` is the union of every human record in the
        // system. The `kind` axis is what makes the view useful —
        // support agents want to jump straight to guardians, coaches
        // routinely want to filter to just athletes.
        filterChips: [
          {
            id: "athlete",
            label: "Athletes",
            filter: { field: "kind", operator: "eq", value: "Athlete" },
            color: "accent",
          },
          {
            id: "guardian",
            label: "Guardians",
            filter: { field: "kind", operator: "eq", value: "Guardian" },
            color: "accent",
          },
          {
            id: "coach",
            label: "Coaches",
            filter: { field: "kind", operator: "eq", value: "Coach" },
            color: "success",
          },
          {
            id: "staff",
            label: "Staff",
            filter: { field: "kind", operator: "eq", value: "Staff" },
            color: "warning",
          },
        ],
        savedViews: [
          {
            id: "active",
            label: "Active",
            filters: [{ field: "isActive", operator: "eq", value: true }],
            isDefault: true,
          },
          {
            id: "inactive",
            label: "Inactive",
            filters: [{ field: "isActive", operator: "eq", value: false }],
          },
        ],
        // Search hits both the person's name and the record they're
        // linked to (a guardian's linkedTo = athlete name) plus
        // email so support can look up a family in one field.
        searchFields: ["fullName", "email", "linkedTo"],
      },
    },
  ],
  routes: [{ element: createElement(ListPage), path: "/people", tier: "protected" }],
};

export default peopleModule;
