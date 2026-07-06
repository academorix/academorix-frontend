/**
 * @file team-roster.tsx
 * @module modules/sports/teams/components/team-roster
 *
 * @description
 * Renders a team's roster (its {@link "@/types".TeamMember} rows) on the detail
 * screen: member, position, and captain flag.
 */

import { Chip, Spinner } from "@academorix/ui/react";
import { useList } from "@refinedev/core";

import type { TeamMember } from "@/types";
import type { ReactNode } from "react";

import { TEAM_POSITION_LABELS } from "@/types";

/**
 * Lists a team's members.
 *
 * @param props - The team id whose roster to load.
 */
export function TeamRoster({ teamId }: { teamId: string }): ReactNode {
  const { result, query } = useList<TeamMember>({
    resource: "team-members",
    pagination: { mode: "off" },
    filters: [{ field: "team_id", operator: "eq", value: teamId }],
  });

  const members = result?.data ?? [];

  if (query.isLoading) {
    return (
      <div className="flex h-24 items-center justify-center">
        <Spinner aria-label="Loading roster" />
      </div>
    );
  }

  if (members.length === 0) {
    return <p className="text-sm text-muted">No members yet.</p>;
  }

  return (
    <ul className="divide-y divide-separator rounded-lg border border-border">
      {members.map((member) => (
        <li key={member.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
          <span className="text-sm font-medium text-foreground">{member.member_id}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">{TEAM_POSITION_LABELS[member.position]}</span>
            {member.is_captain ? (
              <Chip color="success" size="sm" variant="soft">
                Captain
              </Chip>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
