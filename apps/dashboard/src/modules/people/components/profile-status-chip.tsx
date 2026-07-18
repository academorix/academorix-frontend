/**
 * @file profile-status-chip.tsx
 * @module modules/people/components/profile-status-chip
 *
 * @description
 * Renders a {@link ProfileStatus} as a soft, color-coded HeroUI `Chip`. Used
 * on the tenant-projections table so an offboarded projection reads
 * differently from an active one.
 */

import { Chip } from "@stackra/ui/react";

import type { ProfileStatus } from "@/modules/people/people.types";
import type { ReactNode } from "react";

import { PROFILE_STATUS_CHIP_COLORS } from "@/modules/people/people.config";
import { PROFILE_STATUS_LABELS } from "@/modules/people/people.types";

/** Props for {@link ProfileStatusChip}. */
export interface ProfileStatusChipProps {
  /** The profile lifecycle status to render. */
  status: ProfileStatus;
}

/** A soft, color-coded chip for a per-tenant profile status. */
export function ProfileStatusChip({ status }: ProfileStatusChipProps): ReactNode {
  return (
    <Chip color={PROFILE_STATUS_CHIP_COLORS[status]} size="sm" variant="soft">
      {PROFILE_STATUS_LABELS[status]}
    </Chip>
  );
}
