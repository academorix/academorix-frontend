import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

import { medicalFields } from "@/modules/schemas";

const ListPage = lazy(() => import("./pages/list"));
const ShowPage = lazy(() => import("./pages/show"));

const medicalModule: AppModule = {
  name: "medical",
  resources: [
    {
      name: "medical",
      list: "/medical",
      show: "/medical/:id",
      meta: {
        label: "Medical",
        singularLabel: "Medical record",
        icon: "heart-pulse",
        groupKey: "records",
        order: 29,
        featureKey: "medical",
        requiredPermission: "medical.viewAny",
        crud: "full",
        formFields: medicalFields,
        emptyState: {
          title: "No medical records yet",
          description: "Track clearances, injuries, and return-to-play notes for every athlete.",
          actionLabel: "New record",
        },
        // Filter chips = medical record kinds. Clinicians typically
        // want to pivot from the full log to just "injury" or
        // "return-to-play" when triaging.
        filterChips: [
          {
            id: "clearance",
            label: "Clearance",
            filter: { field: "kind", operator: "eq", value: "clearance" },
            color: "success",
          },
          {
            id: "injury",
            label: "Injury",
            filter: { field: "kind", operator: "eq", value: "injury" },
            color: "danger",
          },
          {
            id: "return",
            label: "Return-to-play",
            filter: { field: "kind", operator: "eq", value: "return-to-play" },
            color: "warning",
          },
          {
            id: "assessment",
            label: "Assessment",
            filter: { field: "kind", operator: "eq", value: "assessment" },
            color: "accent",
          },
        ],
        // Medical rows are always pulled up by athlete — the
        // clinician's mental model is "pull up Lina's records"
        // before anything else. `notes` catches the injury type
        // or body part when name isn't remembered.
        searchFields: ["athlete", "notes"],
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/medical", tier: "protected" },
    { element: createElement(ShowPage), path: "/medical/:id", tier: "protected" },
  ],
};

export default medicalModule;
