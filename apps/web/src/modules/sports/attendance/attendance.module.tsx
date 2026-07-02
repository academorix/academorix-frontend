/**
 * @file attendance.module.tsx
 * @module modules/sports/attendance
 *
 * @description
 * The Attendance module — a capture surface for marking athlete attendance at
 * sessions/events, scoped by branch. A single list with inline status editing.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §13.5 "Attendance"
 */

import { CheckCircleIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const AttendanceListPage = lazy(() => import("@/modules/sports/attendance/pages/list"));

/** The Attendance feature module. */
const attendanceModule: AppModule = {
  name: "attendance",
  resources: [
    {
      name: "attendance",
      list: "/attendance",
      meta: {
        label: "Attendance",
        icon: CheckCircleIcon,
        featureKey: "attendance",
        requiredPermission: "attendance.viewAny",
        order: 24,
        scopedBy: ["branch"],
      },
    },
  ],
  routes: [{ tier: "protected", path: "/attendance", element: createElement(AttendanceListPage) }],
};

export default attendanceModule;
