import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

import { coachFields } from "@/modules/schemas";

const ListPage = lazy(() => import("./pages/list"));
const ShowPage = lazy(() => import("./pages/show"));

const coachingModule: AppModule = {
  name: "coaching",
  resources: [
    {
      name: "coaches",
      list: "/coaches",
      show: "/coaches/:id",
      meta: {
        label: "Coaches",
        singularLabel: "Coach",
        // `person-worker` — reads as "professional / coach"; the
        // Gravity UI set has no `person-shield` token.
        icon: "person-worker",
        groupKey: "people",
        order: 16,
        featureKey: "coaches",
        requiredPermission: "coaches.viewAny",
        scopes: ["branch", "season"],
        shortcuts: { navigate: "G C" },
        crud: "full",
        formFields: coachFields,
        emptyState: {
          title: "No coaches yet",
          description: "Register your coaching staff to assign them to teams and sessions.",
          actionLabel: "New coach",
        },
        // Saved views: split coaches by employment status the same
        // way athletes / staff / users do. Head coaches typically
        // stay on the "Active" view during rostering.
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
        // Filter chips = gender + specialisation. Gender chips match
        // the athlete pattern so ops staff feel at home; sport
        // chips let a director pivot to just their swim coaches
        // or gymnastics coaches for a session-planning huddle.
        filterChips: [
          {
            id: "female",
            label: "Female",
            filter: { field: "gender", operator: "eq", value: "F" },
            color: "accent",
          },
          {
            id: "male",
            label: "Male",
            filter: { field: "gender", operator: "eq", value: "M" },
            color: "accent",
          },
          {
            id: "swimming",
            label: "Swimming",
            filter: { field: "sport", operator: "eq", value: "Swimming" },
            color: "success",
          },
          {
            id: "gymnastics",
            label: "Gymnastics",
            filter: { field: "sport", operator: "eq", value: "Gymnastics" },
            color: "success",
          },
          {
            id: "soccer",
            label: "Soccer",
            filter: { field: "sport", operator: "eq", value: "Soccer" },
            color: "success",
          },
          {
            id: "tennis",
            label: "Tennis",
            filter: { field: "sport", operator: "eq", value: "Tennis" },
            color: "success",
          },
        ],
        // A director looks a coach up by name; sport + branch are
        // the fallback axes when the name is fuzzy.
        searchFields: ["fullName", "sport", "branch"],
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/coaches", tier: "protected" },
    { element: createElement(ShowPage), path: "/coaches/:id", tier: "protected" },
  ],
};

export default coachingModule;
