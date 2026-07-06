/**
 * @file documents.module.tsx
 * @module modules/documents
 *
 * @description
 * The Documents module manifest — central document/media storage (uploads,
 * virus scan, signed URLs, expiry). Registered as a placeholder (nav entry +
 * coming-soon page) until its build wave; the resource, feature gate, and
 * permission already exist so it appears in the sidebar for enabled tenants.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.10 "Documents & Media"
 */

import { DocumentTextIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const ComingSoonPage = lazy(() => import("@/components/coming-soon"));

/** The Documents feature module (placeholder). */
const documentsModule: AppModule = {
  name: "documents",
  resources: [
    {
      name: "documents",
      list: "/documents",
      meta: {
        label: "Documents",
        icon: DocumentTextIcon,
        featureKey: "documents",
        requiredPermission: "documents.viewAny",
        order: 96,
        groupKey: "operations",
      },
    },
  ],
  routes: [{ tier: "protected", path: "/documents", element: createElement(ComingSoonPage) }],
};

export default documentsModule;
