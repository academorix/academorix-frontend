/**
 * @file registration-status-chip.tsx
 * @module modules/sports/registrations/components/registration-status-chip
 *
 * @description
 * Color-coded chip for a {@link RegistrationStatus} in the acquisition funnel.
 */

import { Chip } from "@stackra/ui/react";

import type { RegistrationStatus } from "@/types";
import type { ReactNode } from "react";

import { REGISTRATION_STATUS_LABELS } from "@/types";

/** Maps each registration status to a semantic HeroUI Chip color. */
const COLOR: Record<RegistrationStatus, "success" | "warning" | "danger" | "default"> = {
  lead: "default",
  trial: "warning",
  offer: "warning",
  enrolled: "success",
  waitlisted: "default",
  declined: "danger",
};

/** A soft, color-coded chip for a registration's funnel stage. */
export function RegistrationStatusChip({ status }: { status: RegistrationStatus }): ReactNode {
  return (
    <Chip color={COLOR[status]} size="sm" variant="soft">
      {REGISTRATION_STATUS_LABELS[status]}
    </Chip>
  );
}
