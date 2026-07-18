import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

import { athleteFields } from "@/modules/schemas";

const ListPage = lazy(() => import("./pages/list"));
const ShowPage = lazy(() => import("./pages/show"));

const athletesModule: AppModule = {
  name: "athletes",
  resources: [
    {
      name: "athletes",
      list: "/athletes",
      show: "/athletes/:id",
      meta: {
        label: "Athletes",
        singularLabel: "Athlete",
        icon: "person",
        groupKey: "people",
        order: 10,
        featureKey: "athletes",
        requiredPermission: "athletes.viewAny",
        scopes: ["branch"],
        shortcuts: { navigate: "G A", create: "N A" },
        description: "Manage the athletes registered across your branches.",
        crud: "full",
        formFields: athleteFields,
        // ---------------------------------------------------------------
        // Athlete registration is the reference implementation for the
        // ProgressTabs (Medusa-style) form flow. We define the steps
        // explicitly so the final "Review" summary can slot in after
        // the field-carrying steps, and so the labels read as
        // registration-flow verbs rather than raw section names.
        //
        // Every other CRUD-full module auto-derives its steps from
        // `FieldSchema.section` values via `resolveLayoutMode` +
        // `deriveStepsFromSections`, so the same declarative
        // pattern lands everywhere without hand-wired step arrays.
        // ---------------------------------------------------------------
        formLayout: "tabs",
        formSteps: [
          {
            id: "personal",
            label: "Personal",
            icon: "person",
            type: "fields",
            sections: ["Profile"],
            description: "Athlete profile — name, phone, email, gender, date of birth.",
          },
          {
            id: "guardian",
            label: "Guardian",
            icon: "persons",
            type: "fields",
            sections: ["Guardian"],
            description: "Guardian details + emergency contact. Required for athletes under 18.",
          },
          {
            id: "sports",
            label: "Sports",
            icon: "trophy",
            type: "fields",
            sections: ["Sports"],
            description: "Primary sport, team assignment, and branch affiliation.",
          },
          {
            id: "documents",
            label: "Documents",
            icon: "file-arrow-up",
            type: "fields",
            sections: ["Documents"],
            description: "Profile photo, signed consent form, and medical clearance uploads.",
            // Documents can be uploaded post-registration, so this
            // step doesn't block submit — matches the real-world
            // "sign up first, upload later" flow.
            isRequired: false,
          },
          {
            id: "review",
            label: "Review",
            icon: "circle-check",
            type: "review",
            description: "Recap of every field before creating the athlete record.",
          },
        ],
        emptyState: {
          title: "No athletes yet",
          description:
            "Add your first athlete to start tracking attendance, performance, and progress.",
          actionLabel: "New athlete",
        },
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
        filterChips: [
          {
            id: "male",
            label: "Male",
            filter: { field: "gender", operator: "eq", value: "male" },
            color: "accent",
          },
          {
            id: "female",
            label: "Female",
            filter: { field: "gender", operator: "eq", value: "female" },
            color: "accent",
          },
        ],
        // Athletes are pulled up by name or email — matches every
        // other person-shaped surface so muscle-memory carries
        // across resources.
        searchFields: ["fullName", "email"],
        relatedRecords: [
          {
            id: "sessions",
            label: "Recent sessions",
            resource: "training-sessions",
            foreignKey: "athlete",
            limit: 5,
          },
          {
            id: "invoices",
            label: "Recent payments",
            resource: "invoices",
            foreignKey: "athleteId",
            limit: 5,
            columns: [
              { id: "name", header: "Invoice", field: "name", kind: "text" },
              { id: "amount", header: "Amount", field: "amount", kind: "money" },
              { id: "status", header: "Status", field: "status", kind: "chip" },
              { id: "createdAt", header: "Date", field: "createdAt", kind: "date" },
            ],
          },
        ],
        bulkActions: [
          { id: "assign-team", intent: "custom", label: "Assign to team", icon: "people" },
          { id: "move-branch", intent: "custom", label: "Move to branch", icon: "location" },
          { id: "send-invitation", intent: "custom", label: "Send invitation", icon: "envelope" },
        ],
        rowActions: [
          {
            id: "log-medical",
            intent: "custom",
            label: "Log medical clearance",
            icon: "heart-pulse",
          },
        ],
        // The athletes roster on any active tenant routinely exceeds
        // 500 rows across all branches. Virtualise the grid so the
        // DOM stays small — see `DataGrid.virtualized` for the
        // fixed-row-height contract we opt into.
        virtualized: true,
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/athletes", tier: "protected" },
    { element: createElement(ShowPage), path: "/athletes/:id", tier: "protected" },
  ],
};

export default athletesModule;
