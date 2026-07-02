/**
 * @file courses.module.tsx
 * @module modules/courses
 *
 * @description
 * Courses module manifest. Uses the shared coming-soon page until a bespoke
 * screen is built; the resource, permission gate, and mock fixture already exist.
 */

import { BookOpenIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/app/module";

const ComingSoonPage = lazy(() => import("@/components/coming-soon"));

const coursesModule: AppModule = {
  name: "courses",
  resources: [
    {
      name: "courses",
      list: "/courses",
      meta: {
        label: "Courses",
        icon: createElement(BookOpenIcon, { className: "size-5" }),
        featureKey: "courses",
        requiredPermission: "courses.viewAny",
        order: 30,
      },
    },
  ],
  routes: [{ tier: "protected", path: "/courses", element: createElement(ComingSoonPage) }],
};

export default coursesModule;
