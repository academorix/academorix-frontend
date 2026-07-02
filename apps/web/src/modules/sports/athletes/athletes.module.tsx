/**
 * @file athletes.module.tsx
 * @module modules/athletes
 *
 * @description
 * Athletes module manifest — the flagship domain resource. Canonical name is
 * `athletes`; tenants may display it as "Students"/"Members" via terminology.
 */

import { AcademicCapIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const AthleteListPage = lazy(() => import("@/modules/sports/athletes/pages/list"));
const AthleteCreatePage = lazy(() => import("@/modules/sports/athletes/pages/create"));
const AthleteEditPage = lazy(() => import("@/modules/sports/athletes/pages/edit"));
const AthleteShowPage = lazy(() => import("@/modules/sports/athletes/pages/show"));

const athletesModule: AppModule = {
  name: "athletes",
  resources: [
    {
      name: "athletes",
      list: "/athletes",
      create: "/athletes/create",
      edit: "/athletes/:id/edit",
      show: "/athletes/:id",
      meta: {
        label: "Athletes",
        icon: AcademicCapIcon,
        featureKey: "athletes",
        requiredPermission: "athletes.viewAny",
        order: 10,
        scopedBy: ["branch"],
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/athletes", element: createElement(AthleteListPage) },
    { tier: "protected", path: "/athletes/create", element: createElement(AthleteCreatePage) },
    { tier: "protected", path: "/athletes/:id/edit", element: createElement(AthleteEditPage) },
    { tier: "protected", path: "/athletes/:id", element: createElement(AthleteShowPage) },
  ],
};

export default athletesModule;
