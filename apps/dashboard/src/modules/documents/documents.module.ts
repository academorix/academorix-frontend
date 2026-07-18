import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

import { documentFields } from "@/modules/schemas";

const ListPage = lazy(() => import("./pages/list"));
const ShowPage = lazy(() => import("./pages/show"));

const documentsModule: AppModule = {
  name: "documents",
  resources: [
    {
      name: "documents",
      list: "/documents",
      show: "/documents/:id",
      meta: {
        label: "Documents",
        singularLabel: "Document",
        icon: "file-text",
        groupKey: "communications",
        order: 96,
        featureKey: "documents",
        requiredPermission: "documents.viewAny",
        crud: "full",
        formFields: documentFields,
        emptyState: {
          title: "No documents yet",
          description: "Upload consent forms, policies, and contracts here.",
          actionLabel: "New document",
        },
        // Filter chips mirror the five `kind` options declared in the
        // document schema so staff can pivot from the full library to
        // a single class (Consent, Contract, …) in one click.
        filterChips: [
          {
            id: "policy",
            label: "Policy",
            filter: { field: "kind", operator: "eq", value: "policy" },
            color: "accent",
          },
          {
            id: "consent",
            label: "Consent",
            filter: { field: "kind", operator: "eq", value: "consent" },
            color: "accent",
          },
          {
            id: "medical",
            label: "Medical",
            filter: { field: "kind", operator: "eq", value: "medical" },
            color: "danger",
          },
          {
            id: "contract",
            label: "Contract",
            filter: { field: "kind", operator: "eq", value: "contract" },
            color: "accent",
          },
        ],
        // Documents are pulled up by title first, owner (a coach or
        // guardian name) second. Both need to hit one search box.
        searchFields: ["name", "owner"],
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/documents", tier: "protected" },
    { element: createElement(ShowPage), path: "/documents/:id", tier: "protected" },
  ],
};

export default documentsModule;
