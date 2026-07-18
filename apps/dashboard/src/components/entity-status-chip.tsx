/**
 * @file entity-status-chip.tsx
 * @module components/entity-status-chip
 *
 * @description
 * Renders an {@link EntityStatus} as a color-coded HeroUI `Chip`. Reused across
 * every resource whose records carry the generic entity lifecycle
 * (active/inactive/pending/archived), so status styling stays consistent.
 */

import { Chip } from "@stackra/ui/react";

import type { EntityStatus } from "@/types";
import type { ReactNode } from "react";

import { ENTITY_STATUS_LABELS } from "@/types";

/** Maps each entity status to a semantic HeroUI Chip color. */
const STATUS_COLOR: Record<EntityStatus, "success" | "warning" | "danger" | "default"> = {
  active: "success",
  pending: "warning",
  archived: "danger",
  inactive: "default",
};

/** Props for {@link EntityStatusChip}. */
interface EntityStatusChipProps {
  /** The status to render. */
  status: EntityStatus;
}

/**
 * A soft, color-coded chip for an entity's lifecycle status.
 *
 * @param props - The status value.
 */
export function EntityStatusChip({ status }: EntityStatusChipProps): ReactNode {
  return (
    <Chip color={STATUS_COLOR[status]} size="sm" variant="soft">
      {ENTITY_STATUS_LABELS[status]}
    </Chip>
  );
}
