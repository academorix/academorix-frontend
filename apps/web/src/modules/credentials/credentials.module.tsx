/**
 * @file credentials.module.tsx
 * @module modules/credentials
 *
 * @description
 * The Credentials module — the NFC/RFID/QR access tokens athletes tap to check
 * in at the front desk. Read-only management (list + detail), scoped by branch.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.20 "Reception & Front Desk"
 */

import { QrCodeIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const CredentialListPage = lazy(() => import("@/modules/credentials/pages/list"));
const CredentialShowPage = lazy(() => import("@/modules/credentials/pages/show"));

/** The Credentials feature module. */
const credentialsModule: AppModule = {
  name: "credentials",
  resources: [
    {
      name: "credentials",
      list: "/credentials",
      show: "/credentials/:id",
      meta: {
        label: "Credentials",
        icon: QrCodeIcon,
        featureKey: "credentials",
        requiredPermission: "credentials.viewAny",
        order: 27,
        scopedBy: ["branch"],
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/credentials", element: createElement(CredentialListPage) },
    { tier: "protected", path: "/credentials/:id", element: createElement(CredentialShowPage) },
  ],
};

export default credentialsModule;
