/**
 * @file facility-capacity-badge.tsx
 * @module modules/facilities/components/facility-capacity-badge
 *
 * @description
 * Renders a facility's capacity as a compact "N unit" badge (e.g. `22 players`,
 * `18 swimmers`). Falls back to the configured default unit for the facility
 * type when the record does not yet carry a `unit_of_capacity` column — this
 * matches the module's `TODO(backend-endpoint)` for surfacing the column on
 * the API side.
 *
 * Used in the DataGrid's capacity column and on the detail-page metadata row.
 */

import { Chip } from "@academorix/ui/react";

import type { Facility } from "@/modules/facilities/facilities.types";
import type { ReactNode } from "react";

import { FACILITY_DEFAULT_UNIT_OF_CAPACITY } from "@/modules/facilities/facilities.config";

/** Props for {@link FacilityCapacityBadge}. */
export interface FacilityCapacityBadgeProps {
  /** The facility whose capacity is being rendered. */
  facility: Pick<Facility, "capacity" | "unit_of_capacity" | "type">;
  /**
   * Visual variant. `"chip"` (default) wraps the number in a soft HeroUI Chip
   * for lists; `"inline"` renders bare text for tight cells / detail rows.
   */
  variant?: "chip" | "inline";
}

/**
 * Composes a facility's capacity + unit into a single label. Falls back to the
 * per-type default when the record does not yet carry `unit_of_capacity`.
 */
function toLabel(facility: FacilityCapacityBadgeProps["facility"]): string {
  // Prefer the record's own unit; fall back to the type-default only when the
  // record does not carry one (the backend fixture omits it for now).
  const unit =
    facility.unit_of_capacity && facility.unit_of_capacity.trim() !== ""
      ? facility.unit_of_capacity
      : FACILITY_DEFAULT_UNIT_OF_CAPACITY[facility.type];

  // Use tabular numerals so aligned rows in the DataGrid stay tidy.
  return `${facility.capacity} ${unit}`;
}

/**
 * A capacity + unit-of-capacity display. Renders as a chip in lists and as
 * plain text on detail rows.
 *
 * @param props - The facility and the visual variant.
 */
export function FacilityCapacityBadge({
  facility,
  variant = "chip",
}: FacilityCapacityBadgeProps): ReactNode {
  const label = toLabel(facility);

  if (variant === "inline") {
    return <span className="tabular-nums">{label}</span>;
  }

  return (
    <Chip size="sm" variant="secondary">
      <Chip.Label className="tabular-nums">{label}</Chip.Label>
    </Chip>
  );
}
