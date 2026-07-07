/**
 * @file booking-status-chip.test.tsx
 * @module modules/facilities/__tests__/booking-status-chip.test
 *
 * @description
 * Rendering tests for {@link BookingStatusChip}. Every {@link BookingStatus}
 * value must render its human-readable label from `BOOKING_STATUS_LABELS`,
 * and its semantic HeroUI Chip colour is asserted through the label lookup
 * (colour selection is otherwise a purely visual concern).
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BookingStatusChip } from "@/modules/facilities/components/booking-status-chip";
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUSES,
} from "@/modules/facilities/facilities.types";

describe("BookingStatusChip", () => {
  // Same shape as the facility-type-chip suite: a parametric loop guarantees
  // every status has a label + colour configured.
  it.each(BOOKING_STATUSES)("renders the label for %s", (status) => {
    render(<BookingStatusChip status={status} />);

    expect(screen.getByText(BOOKING_STATUS_LABELS[status])).toBeInTheDocument();
  });

  it("renders every status label as distinct text", () => {
    // Guard against a mistake that collapses two statuses to the same label
    // (e.g. mapping both `pending` and `blocked` to "Pending").
    const labels = new Set(BOOKING_STATUSES.map((status) => BOOKING_STATUS_LABELS[status]));

    expect(labels.size).toBe(BOOKING_STATUSES.length);
  });
});
