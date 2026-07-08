/**
 * @file attendance.module.tsx
 * @module modules/sports/attendance
 *
 * @description
 * The Attendance module — a capture surface for marking athlete attendance at
 * sessions/events, scoped by branch.
 *
 * Two surfaces:
 *
 *   - `/attendance` — the classic list. One row per marker with an inline
 *     status control. Always available.
 *   - `/attendance/agenda` — the calendar/agenda view (DASHBOARD_UX_PLAN.md
 *     §8 + Phase 5). Renders one calendar event per session and opens the
 *     roster in a drawer on click. Gated behind
 *     `features.attendanceAgenda` — when off, the agenda route redirects to
 *     the classic list so links stay resolvable.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §13.5 "Attendance"
 * @see apps/dashboard/DASHBOARD_UX_PLAN.md §8
 */

import { CheckCircleIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const AttendanceListPage = lazy(() => import("@/modules/sports/attendance/pages/list"));
const AttendanceAgendaPage = lazy(() => import("@/modules/sports/attendance/pages/agenda"));

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
        groupKey: "operations",
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/attendance", element: createElement(AttendanceListPage) },
    // The agenda route is registered unconditionally so a permalink stays
    // resolvable in every environment. The page component checks the feature
    // flag on mount and redirects to `/attendance` when off — see
    // `pages/agenda.tsx` for the guard logic. Keeping the check inside the
    // page (rather than here) means the flag can flip at runtime via env var
    // without a build.
    {
      tier: "protected",
      path: "/attendance/agenda",
      element: createElement(AttendanceAgendaPage),
    },
  ],
};

export default attendanceModule;
