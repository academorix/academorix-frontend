/**
 * @file list.tsx
 * @module modules/sports/coaching/pages/list
 *
 * @description
 * Coaching assignments (scoped by branch + season) — which coach is assigned to
 * which team, and in what role. Coach and team names are resolved from the
 * `staff` and `teams` resources so the grid shows human labels, not ids.
 */

import { useList } from "@refinedev/core";
import { useMemo } from "react";

import type { CoachAssignment } from "@/modules/sports/coaching/coaching.types";
import type { Staff, Team } from "@/types";
import type { DataGridColumn } from "@stackra/ui/react";
import type { ReactNode } from "react";

import { ListView, ResourceDataGrid, ShowButton } from "@/components/refine";

/** The coaching assignments list page. */
export default function CoachingList(): ReactNode {
  const { result: staffResult } = useList<Staff>({
    resource: "staff",
    pagination: { mode: "off" },
  });
  const { result: teamsResult } = useList<Team>({ resource: "teams", pagination: { mode: "off" } });

  // Build id → display-name maps so the grid can show names, not raw ids.
  const staffName = useMemo(() => {
    const map = new Map<string, string>();

    for (const member of staffResult?.data ?? []) {
      map.set(member.id, `${member.first_name} ${member.last_name}`);
    }

    return map;
  }, [staffResult?.data]);

  const teamName = useMemo(() => {
    const map = new Map<string, string>();

    for (const team of teamsResult?.data ?? []) {
      map.set(team.id, team.name);
    }

    return map;
  }, [teamsResult?.data]);

  const columns = useMemo<DataGridColumn<CoachAssignment>[]>(
    () => [
      {
        id: "staff_id",
        header: "Coach",
        isRowHeader: true,
        minWidth: 200,
        cell: (assignment) => (
          <span className="font-medium">
            {staffName.get(assignment.staff_id) ?? assignment.staff_id}
          </span>
        ),
      },
      {
        id: "team_id",
        header: "Team",
        minWidth: 180,
        cell: (assignment) => teamName.get(assignment.team_id) ?? assignment.team_id,
      },
      { id: "role", header: "Role", allowsSorting: true, cell: (assignment) => assignment.role },
      {
        id: "actions",
        header: "",
        align: "end",
        minWidth: 80,
        cell: (assignment) => (
          <div className="flex justify-end">
            <ShowButton
              isIconOnly
              aria-label="View assignment"
              recordItemId={assignment.id}
              resource="coaches"
              size="sm"
              variant="ghost"
            />
          </div>
        ),
      },
    ],
    [staffName, teamName],
  );

  return (
    <ListView resource="coaches" title="Coaching">
      <ResourceDataGrid<CoachAssignment>
        ariaLabel="Coaching assignments"
        columns={columns}
        contentClassName="min-w-[640px]"
        resource="coaches"
      />
    </ListView>
  );
}
