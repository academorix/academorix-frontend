import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

import { publicSiteFields } from "@/modules/schemas";

const ListPage = lazy(() => import("./pages/list"));
const ShowPage = lazy(() => import("./pages/show"));

const publicSiteModule: AppModule = {
  name: "public-site",
  resources: [
    {
      name: "public-site",
      list: "/public-site",
      show: "/public-site/:id",
      meta: {
        label: "Public site",
        singularLabel: "Page",
        icon: "globe",
        groupKey: "growth",
        order: 60,
        featureKey: "public-site",
        requiredPermission: "public-site.viewAny",
        crud: "full",
        formFields: publicSiteFields,
        emptyState: {
          title: "No pages yet",
          description: "Publish landing pages to attract new leads.",
          actionLabel: "New page",
        },
        // Saved views: split the CMS by publish state. Marketers
        // typically edit drafts and browse published pages in
        // separate contexts.
        savedViews: [
          {
            id: "published",
            label: "Published",
            filters: [{ field: "isPublished", operator: "eq", value: true }],
            isDefault: true,
          },
          {
            id: "drafts",
            label: "Drafts",
            filters: [{ field: "isPublished", operator: "eq", value: false }],
          },
        ],
        // Pages are recalled by title or by URL slug — the two
        // free-text axes a CMS surfaces.
        searchFields: ["name", "slug"],
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/public-site", tier: "protected" },
    { element: createElement(ShowPage), path: "/public-site/:id", tier: "protected" },
  ],
};

export default publicSiteModule;
