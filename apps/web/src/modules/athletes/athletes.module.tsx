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

import type { AppModule } from "@/app/module";

const AthleteListPage = lazy(() => import("@/modules/athletes/pages/athlete-list-page"));

const athletesModule: AppModule = {
  name: "athletes",
  resources: [
    {
      name: "athletes",
      list: "/athletes",
      meta: {
        label: "Athletes",
        icon: createElement(AcademicCapIcon, { className: "size-5" }),
        featureKey: "athletes",
        requiredPermission: "athletes.viewAny",
        order: 10,
      },
    },
  ],
  routes: [{ tier: "protected", path: "/athletes", element: createElement(AthleteListPage) }],
};

export default athletesModule;
