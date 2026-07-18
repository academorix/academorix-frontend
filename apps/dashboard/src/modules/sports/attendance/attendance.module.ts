import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const ListPage = lazy(() => import("./pages/list"));
const ExtraPage0 = lazy(() => import("./pages/extra-0"));

const attendanceModule: AppModule = {
  name: "attendance",
  resources: [
    {
      name: "attendance",
      list: "/attendance",
      meta: {
        label: "Attendance",
        singularLabel: "Attendance record",
        icon: "circle-check",
        groupKey: "schedule",
        order: 24,
        featureKey: "attendance",
        requiredPermission: "attendance.viewAny",
        scopes: ["branch"],
        crud: "list-only",
        description:
          "Coaches record roll-call by session; product owners cross-check the batch view for reporting.",
        emptyState: {
          title: "No attendance recorded",
          description:
            "Attendance is logged from sessions and matches. Open a session in the agenda view to start marking athletes in.",
          actionLabel: "Open today's agenda",
          actionRoute: "/attendance?view=agenda",
        },
        savedViews: [
          {
            id: "today",
            label: "Today",
            filters: [
              {
                field: "createdAt",
                operator: "gte",
                value: new Date(
                  new Date().setHours(0, 0, 0, 0) - 30 * 24 * 60 * 60 * 1000,
                ).toISOString(),
              },
            ],
            isDefault: true,
          },
          {
            id: "this-week",
            label: "This week",
            filters: [
              {
                field: "createdAt",
                operator: "gte",
                value: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
              },
            ],
          },
          {
            id: "absentees",
            label: "Absentees only",
            filters: [{ field: "isActive", operator: "eq", value: false }],
          },
        ],
        filterChips: [
          {
            id: "present",
            label: "Present",
            filter: { field: "status.text", operator: "eq", value: "Present" },
            color: "success",
          },
          {
            id: "late",
            label: "Late",
            filter: { field: "status.text", operator: "eq", value: "Late" },
            color: "warning",
          },
          {
            id: "absent",
            label: "Absent",
            filter: { field: "status.text", operator: "eq", value: "Absent" },
            color: "danger",
          },
          {
            id: "excused",
            label: "Excused",
            filter: { field: "status.text", operator: "eq", value: "Excused" },
            color: "accent",
          },
        ],
        // Attendance rows join three axes into one line — the
        // session, the athlete, and the coach. Users search from
        // whichever they remember first, so all three go into
        // the search index.
        searchFields: ["athlete", "sessionName", "coach", "branch"],
      },
    },
  ],
  routes: [
    { element: createElement(ListPage), path: "/attendance", tier: "protected" },
    { element: createElement(ExtraPage0), path: "/attendance/agenda", tier: "protected" },
  ],
};

export default attendanceModule;
