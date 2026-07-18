/**
 * @file lead-stage-chip.tsx
 * @module modules/leads/components/lead-stage-chip
 *
 * @description
 * Renders a {@link LeadStage} as a color-coded HeroUI `Chip` so pipeline styling
 * stays consistent across the list and detail screens.
 */

import { Chip } from "@stackra/ui/react";

import type { LeadStage } from "@/modules/leads/leads.types";
import type { ReactNode } from "react";

import { LEAD_STAGE_LABELS } from "@/modules/leads/leads.types";

/** Maps each pipeline stage to a semantic Chip color. */
const STAGE_COLOR: Record<LeadStage, "success" | "warning" | "danger" | "default"> = {
  new: "default",
  contacted: "default",
  qualified: "warning",
  trial_booked: "warning",
  won: "success",
  lost: "danger",
};

/** Props for {@link LeadStageChip}. */
interface LeadStageChipProps {
  /** The pipeline stage to render. */
  stage: LeadStage;
}

/** A soft, color-coded chip for a lead's pipeline stage. */
export function LeadStageChip({ stage }: LeadStageChipProps): ReactNode {
  return (
    <Chip color={STAGE_COLOR[stage]} size="sm" variant="soft">
      {LEAD_STAGE_LABELS[stage]}
    </Chip>
  );
}
