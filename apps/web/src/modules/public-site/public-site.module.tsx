/**
 * @file public-site.module.tsx
 * @module modules/public-site
 *
 * @description
 * The Public Site (CMS) module — manage the tenant's public marketing pages.
 * List + detail (read surfaces for the demo; page authoring lands with the
 * write API).
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §19 "Public Site & CMS"
 */

import { GlobeAltIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const PublicSiteListPage = lazy(() => import("@/modules/public-site/pages/list"));
const PublicSiteShowPage = lazy(() => import("@/modules/public-site/pages/show"));

/** The Public Site feature module. */
const publicSiteModule: AppModule = {
  name: "public-site",
  resources: [
    {
      name: "public-site",
      list: "/public-site",
      show: "/public-site/:id",
      meta: {
        label: "Public Site",
        icon: GlobeAltIcon,
        featureKey: "public-site",
        requiredPermission: "public-site.viewAny",
        order: 60,
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/public-site", element: createElement(PublicSiteListPage) },
    { tier: "protected", path: "/public-site/:id", element: createElement(PublicSiteShowPage) },
  ],
};

export default publicSiteModule;
