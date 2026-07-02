/**
 * @file development-status-chip.tsx
 * @module modules/sports/development/components/development-status-chip
 *
 * @description
 * Renders a {@link DevelopmentStatus} as a color-coded HeroUI `Chip` so plan
 * status styling stays consistent across the list and detail screens.
 */

import { Chip } from "@academorix/ui/react";

import type { DevelopmentStatus } from "@/modules/sports/development/development.types";
import type { ReactNode } from "react";

import { DEVELOPMENT_STATUS_LABELS } from "@/modules/sports/development/development.types";

/**
 * Maps each development status to a semantic HeroUI Chip color: an in-flight
 * goal is amber (`warning`), a met goal green (`success`), and a paused goal
 * neutral (`default`).
 */
const STATUS_COLOR: Record<DevelopmentStatus, "success" | "warning" | "default"> = {
  active: "warning",
  achieved: "success",
  paused: "default",
};

/** Props for {@link DevelopmentStatusChip}. */
interface DevelopmentStatusChipProps {
  /** The plan status to render. */
  status: DevelopmentStatus;
}

/**
 * A soft, color-coded chip for a development plan's lifecycle status.
 *
 * @param props - The status value to render.
 */
export function DevelopmentStatusChip({ status }: DevelopmentStatusChipProps): ReactNode {
  return (
    <Chip color={STATUS_COLOR[status]} size="sm" variant="soft">
      {DEVELOPMENT_STATUS_LABELS[status]}
    </Chip>
  );
}
