/**
 * @file match-status-chip.tsx
 * @module modules/sports/matches/components/match-status-chip
 *
 * @description
 * Color-coded chip for a {@link MatchStatus}, reused by the matches list and
 * detail screens.
 */

import { Chip } from "@stackra/ui/react";

import type { MatchStatus } from "@/types";
import type { ReactNode } from "react";

import { MATCH_STATUS_LABELS } from "@/types";

/** Maps each match status to a semantic HeroUI Chip color. */
const COLOR: Record<MatchStatus, "success" | "warning" | "danger" | "default"> = {
  draft: "default",
  scheduled: "warning",
  in_progress: "success",
  completed: "default",
  cancelled: "danger",
  postponed: "warning",
};

/** A soft, color-coded chip for a match's status. */
export function MatchStatusChip({ status }: { status: MatchStatus }): ReactNode {
  return (
    <Chip color={COLOR[status]} size="sm" variant="soft">
      {MATCH_STATUS_LABELS[status]}
    </Chip>
  );
}
