/**
 * @file staff-status-chip.tsx
 * @module modules/staff/components/staff-status-chip
 *
 * @description
 * Color-coded chip for a {@link StaffStatus}, reused by the staff list and detail.
 */

import { Chip } from "@stackra/ui/react";

import type { StaffStatus } from "@/types";
import type { ReactNode } from "react";

import { STAFF_STATUS_LABELS } from "@/types";

/** Maps each staff status to a semantic HeroUI Chip color. */
const COLOR: Record<StaffStatus, "success" | "warning" | "danger" | "default"> = {
  onboarding: "warning",
  active: "success",
  on_leave: "default",
  offboarded: "danger",
};

/** A soft, color-coded chip for a staff member's status. */
export function StaffStatusChip({ status }: { status: StaffStatus }): ReactNode {
  return (
    <Chip color={COLOR[status]} size="sm" variant="soft">
      {STAFF_STATUS_LABELS[status]}
    </Chip>
  );
}
