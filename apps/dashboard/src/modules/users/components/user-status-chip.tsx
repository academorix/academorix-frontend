/**
 * @file user-status-chip.tsx
 * @module modules/users/components/user-status-chip
 *
 * @description
 * Color-coded chip for a {@link UserStatus}, reused by the users list and detail.
 */

import { Chip } from "@stackra/ui/react";

import type { UserStatus } from "@/types";
import type { ReactNode } from "react";

import { USER_STATUS_LABELS } from "@/types";

/** Maps each user status to a semantic HeroUI Chip color. */
const COLOR: Record<UserStatus, "success" | "warning" | "danger" | "default"> = {
  pending_verification: "warning",
  active: "success",
  suspended: "danger",
  inactive: "default",
  locked: "danger",
  banned: "danger",
};

/** A soft, color-coded chip for a user's status. */
export function UserStatusChip({ status }: { status: UserStatus }): ReactNode {
  return (
    <Chip color={COLOR[status]} size="sm" variant="soft">
      {USER_STATUS_LABELS[status]}
    </Chip>
  );
}
