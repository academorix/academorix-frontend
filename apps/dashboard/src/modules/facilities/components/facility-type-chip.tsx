/**
 * @file facility-type-chip.tsx
 * @module modules/facilities/components/facility-type-chip
 *
 * @description
 * Renders a {@link FacilityType} as a color-coded HeroUI `Chip` prefixed with
 * the type's icon glyph. Reused across the facility list, the detail screen,
 * and the booking list so a "pool" always looks the same.
 */

import { Chip } from "@academorix/ui/react";

import type { FacilityType } from "@/modules/facilities/facilities.types";
import type { ReactNode } from "react";

import { FACILITY_TYPE_COLOR, FACILITY_TYPE_ICON } from "@/modules/facilities/facilities.config";
import { FACILITY_TYPE_LABELS } from "@/modules/facilities/facilities.types";

/** Props for {@link FacilityTypeChip}. */
export interface FacilityTypeChipProps {
  /** The facility type to render. */
  type: FacilityType;
  /**
   * Whether to show the icon glyph before the label. Defaults to `true`. The
   * dense list cell passes `false` when the icon column already shows the
   * glyph, to avoid doubling up.
   */
  showIcon?: boolean;
}

/**
 * A soft, color-coded chip for a facility's type. Prefixed with the type's
 * icon by default; call sites that already render the icon in a neighbouring
 * cell can pass `showIcon={false}` to render just the label.
 *
 * @param props - The facility type and optional icon toggle.
 */
export function FacilityTypeChip({ type, showIcon = true }: FacilityTypeChipProps): ReactNode {
  const Icon = FACILITY_TYPE_ICON[type];

  return (
    <Chip color={FACILITY_TYPE_COLOR[type]} size="sm" variant="soft">
      {showIcon ? (
        // aria-hidden — the label carries the semantic meaning; the icon is
        // decorative when read out by a screen reader.
        <Icon aria-hidden="true" className="size-3.5" />
      ) : null}
      {FACILITY_TYPE_LABELS[type]}
    </Chip>
  );
}
