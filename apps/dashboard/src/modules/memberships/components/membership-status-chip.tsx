/**
 * @file membership-status-chip.tsx
 * @module modules/memberships/components/membership-status-chip
 *
 * @description
 * Color-coded chip for a {@link MembershipStatus}, reused by the memberships
 * list and detail screens.
 */

import { Chip } from "@stackra/ui/react";

import type { MembershipStatus } from "@/types";
import type { ReactNode } from "react";

import { MEMBERSHIP_STATUS_LABELS } from "@/types";

/** Maps each membership status to a semantic HeroUI Chip color. */
const COLOR: Record<MembershipStatus, "success" | "warning" | "danger" | "default"> = {
  trialing: "warning",
  active: "success",
  past_due: "danger",
  paused: "default",
  cancelled: "default",
  expired: "danger",
};

/** A soft, color-coded chip for a membership's status. */
export function MembershipStatusChip({ status }: { status: MembershipStatus }): ReactNode {
  return (
    <Chip color={COLOR[status]} size="sm" variant="soft">
      {MEMBERSHIP_STATUS_LABELS[status]}
    </Chip>
  );
}
