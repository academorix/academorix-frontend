/**
 * @file booking-status-chip.tsx
 * @module modules/facilities/components/booking-status-chip
 *
 * @description
 * Renders a {@link BookingStatus} as a color-coded HeroUI `Chip` so
 * booking-status styling stays consistent across the agenda list, the calendar
 * cells, and any inline booking references on the facility detail screen.
 */

import { Chip } from "@academorix/ui/react";

import type { BookingStatus } from "@/modules/facilities/facilities.types";
import type { ReactNode } from "react";

import { BOOKING_STATUS_COLOR } from "@/modules/facilities/facilities.config";
import { BOOKING_STATUS_LABELS } from "@/modules/facilities/facilities.types";

/** Props for {@link BookingStatusChip}. */
export interface BookingStatusChipProps {
  /** The booking status to render. */
  status: BookingStatus;
}

/**
 * A soft, color-coded chip for a resource booking's lifecycle status.
 *
 * @param props - The booking status value.
 */
export function BookingStatusChip({ status }: BookingStatusChipProps): ReactNode {
  return (
    <Chip color={BOOKING_STATUS_COLOR[status]} size="sm" variant="soft">
      {BOOKING_STATUS_LABELS[status]}
    </Chip>
  );
}
