import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

import { credentialFields } from "@/modules/schemas";

const ListPage = lazy(() => import("./pages/list"));
const ShowPage = lazy(() => import("./pages/show"));

const credentialsModule: AppModule = {
  name: "credentials",
  resources: [
    {
      name: "credentials",
      list: "/credentials",
      show: "/credentials/:id",
      meta: {
        label: "Credentials",
        singularLabel: "Credential",
        // `key` — credentials grant access; Gravity UI has no
        // `id-card` token so we lean on the access-metaphor icon.
        icon: "key",
        groupKey: "records",
        order: 27,
        featureKey: "credentials",
        requiredPermission: "credentials.viewAny",
        scopes: ["branch"],
        crud: "full",
        formFields: credentialFields,
        emptyState: {
          title: "No credentials yet",
          description: "Issue NFC / RFID / QR credentials for reception check-in.",
          actionLabel: "New credential",
        },
        // ---------------------------------------------------------------
        // Saved views: split the list by lifecycle so front-desk staff
        // can jump to expiring cards without scanning the full roster.
        // ---------------------------------------------------------------
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
        // ---------------------------------------------------------------
        // Filter chips — cover the three credential types from the
        // schema. Chips are additive: multi-select composes an OR-of-
        // ANDs query at the DataGrid level.
        // ---------------------------------------------------------------
        filterChips: [
          {
            id: "nfc",
            label: "NFC",
            filter: { field: "kind", operator: "eq", value: "nfc" },
            color: "accent",
          },
          {
            id: "rfid",
            label: "RFID",
            filter: { field: "kind", operator: "eq", value: "rfid" },
            color: "accent",
          },
          {
            id: "qr",
            label: "QR",
            filter: { field: "kind", operator: "eq", value: "qr" },
            color: "accent",
          },
        ],
        // Credentials are pulled up by the holder (guardian or
        // athlete) or by the credential number / label.
        searchFields: ["name", "holder"],
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/credentials", tier: "protected" },
    { element: createElement(ShowPage), path: "/credentials/:id", tier: "protected" },
  ],
};

export default credentialsModule;
