import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

import { integrationFields } from "@/modules/schemas";

const ListPage = lazy(() => import("./pages/list"));
const ShowPage = lazy(() => import("./pages/show"));

const integrationsModule: AppModule = {
  name: "integrations",
  resources: [
    {
      name: "integrations",
      list: "/integrations",
      show: "/integrations/:id",
      meta: {
        label: "Integrations",
        singularLabel: "Integration",
        // `plug-connection` — the Gravity UI token for a connected
        // plug/integration point. Bare `plug` is not in the set.
        icon: "plug-connection",
        groupKey: "administration",
        order: 85,
        featureKey: "integrations",
        requiredPermission: "integrations.viewAny",
        shortcuts: { navigate: "G I", create: "N I" },
        crud: "full",
        formFields: integrationFields,
        emptyState: {
          title: "No integrations yet",
          description: "Connect third-party services — payments, email, calendars, SSO.",
          actionLabel: "New integration",
        },
        // Saved views: split by connection lifecycle. "Connected"
        // is what ops watches after a rotation window; "Not
        // connected" is where onboarding drops when a tenant hasn't
        // wired an integration yet.
        savedViews: [
          {
            id: "connected",
            label: "Connected",
            filters: [{ field: "isActive", operator: "eq", value: true }],
            isDefault: true,
          },
          {
            id: "disconnected",
            label: "Disconnected",
            filters: [{ field: "isActive", operator: "eq", value: false }],
          },
        ],
        // Filter chips = integration categories from the fixture's
        // `kind` column. Kept broad so a tenant with a bespoke
        // integration falls through to `Other` instead of a chip
        // outage.
        filterChips: [
          {
            id: "payments",
            label: "Payments",
            filter: { field: "kind", operator: "eq", value: "Payments" },
            color: "success",
          },
          {
            id: "sms",
            label: "SMS",
            filter: { field: "kind", operator: "eq", value: "SMS" },
            color: "accent",
          },
          {
            id: "calendar",
            label: "Calendar",
            filter: { field: "kind", operator: "eq", value: "Calendar" },
            color: "accent",
          },
          {
            id: "email",
            label: "Email",
            filter: { field: "kind", operator: "eq", value: "Email" },
            color: "accent",
          },
          {
            id: "sso",
            label: "SSO",
            filter: { field: "kind", operator: "eq", value: "SSO" },
            color: "warning",
          },
        ],
        // Ops looks integrations up by name and by kind ("stripe" /
        // "twilio" / "payments"); owner is the third axis when
        // triaging a rotation.
        searchFields: ["name", "kind", "owner"],
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/integrations", tier: "protected" },
    { element: createElement(ShowPage), path: "/integrations/:id", tier: "protected" },
  ],
};

export default integrationsModule;
