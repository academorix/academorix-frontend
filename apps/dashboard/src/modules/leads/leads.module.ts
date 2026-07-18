import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

import { leadFields } from "@/modules/schemas";

const ListPage = lazy(() => import("./pages/list"));
const ShowPage = lazy(() => import("./pages/show"));
const ExtraPage0 = lazy(() => import("./pages/extra-0"));

const leadsModule: AppModule = {
  name: "leads",
  resources: [
    {
      name: "leads",
      list: "/leads",
      show: "/leads/:id",
      meta: {
        label: "Leads",
        singularLabel: "Lead",
        icon: "funnel",
        groupKey: "growth",
        order: 44,
        featureKey: "leads",
        requiredPermission: "leads.viewAny",
        shortcuts: { navigate: "G L", create: "N L" },
        description: "Track prospective members through your acquisition funnel.",
        crud: "full",
        formFields: leadFields,
        emptyState: {
          title: "No leads yet",
          description: "Capture new prospects here and route them through your acquisition stages.",
          actionLabel: "New lead",
        },
        savedViews: [
          {
            id: "open",
            label: "Open",
            filters: [{ field: "stage", operator: "ne", value: "converted" }],
            isDefault: true,
          },
          {
            id: "converted",
            label: "Converted",
            filters: [{ field: "stage", operator: "eq", value: "converted" }],
          },
          {
            id: "lost",
            label: "Lost",
            filters: [{ field: "stage", operator: "eq", value: "lost" }],
          },
        ],
        filterChips: [
          {
            id: "new",
            label: "New",
            filter: { field: "stage", operator: "eq", value: "new" },
            color: "accent",
          },
          {
            id: "qualified",
            label: "Qualified",
            filter: { field: "stage", operator: "eq", value: "qualified" },
            color: "success",
          },
          {
            id: "hot",
            label: "High intent",
            filter: { field: "intent", operator: "eq", value: "high" },
            color: "warning",
          },
        ],
        // Leads are picked up by contact info — name, email, or
        // phone; growth reps recall one of the three fastest.
        searchFields: ["fullName", "email", "phone"],
        bulkActions: [
          { id: "assign-owner", intent: "custom", label: "Assign owner", icon: "person" },
          { id: "change-stage", intent: "custom", label: "Change stage", icon: "workflow" },
          { id: "convert", intent: "custom", label: "Convert", icon: "arrow-right-from-square" },
          { id: "send-follow-up", intent: "custom", label: "Send follow-up", icon: "envelope" },
        ],
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/leads", tier: "protected" },
    { element: createElement(ShowPage), path: "/leads/:id", tier: "protected" },
    { element: createElement(ExtraPage0), path: "/leads/kanban", tier: "protected" },
  ],
};

export default leadsModule;
