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

const AthleteListPage = lazy(() => import("@/modules/athletes/pages/list"));

const athletesModule: AppModule = {
  name: "athletes",
  resources: [
    {
      name: "athletes",
      list: "/athletes",
      meta: {
        label: "Athletes",
        icon: AcademicCapIcon,
        featureKey: "athletes",
        requiredPermission: "athletes.viewAny",
        order: 10,
      },
    },
  ],
  routes: [{ tier: "protected", path: "/athletes", element: createElement(AthleteListPage) }],
};

export default athletesModule;
