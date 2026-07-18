/**
 * @file season-status-chip.tsx
 * @module modules/sports/seasons/components/season-status-chip
 *
 * @description
 * Color-coded chip for a {@link SeasonStatus}, reused by the seasons list and
 * detail screens.
 */

import { Chip } from "@stackra/ui/react";

import type { SeasonStatus } from "@/types";
import type { ReactNode } from "react";

import { SEASON_STATUS_LABELS } from "@/types";

/** Maps each season status to a semantic HeroUI Chip color. */
const COLOR: Record<SeasonStatus, "success" | "warning" | "danger" | "default"> = {
  upcoming: "warning",
  active: "success",
  closed: "default",
  archived: "danger",
};

/** A soft, color-coded chip for a season's status. */
export function SeasonStatusChip({ status }: { status: SeasonStatus }): ReactNode {
  return (
    <Chip color={COLOR[status]} size="sm" variant="soft">
      {SEASON_STATUS_LABELS[status]}
    </Chip>
  );
}
