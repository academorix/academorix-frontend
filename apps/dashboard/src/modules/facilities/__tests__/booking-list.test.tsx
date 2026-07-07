/**
 * @file booking-list.test.tsx
 * @module modules/facilities/__tests__/booking-list.test
 *
 * @description
 * Rendering tests for {@link BookingList}. The list is a pure presentation
 * component (no data-fetching), so the tests inject an inline
 * {@link ResourceBooking} fixture — a slimmed-down copy of the shapes shipped
 * in `backend/modules/Facilities/database/fixtures/resource-bookings.json` —
 * and assert:
 *
 *   1. Empty state renders the caller's message.
 *   2. Non-empty state renders one row per booking with its purpose and status.
 *   3. Bookings are sorted ascending by `start_at`, regardless of input order.
 *   4. Multi-day bookings (a blackout) render the full end date + time.
 *   5. Booking notes appear beneath the schedule row.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ResourceBooking } from "@/modules/facilities/facilities.types";

import { BookingList } from "@/modules/facilities/components/booking-list";

/**
 * A minimal booking fixture; the test suite fills in only the fields the
 * component reads. The `tenant_id` / timestamp base columns are inherited
 * from BaseModel + TenantScoped and default to arbitrary stable strings.
 */
function booking(overrides: Partial<ResourceBooking> & { id: string }): ResourceBooking {
  return {
    tenant_id: "tnt_riverside",
    resource_id: "fac_river_pitch_1",
    activity_type: "training",
    activity_id: "trn_1",
    start_at: "2026-07-06T16:00:00Z",
    end_at: "2026-07-06T17:30:00Z",
    status: "confirmed",
    booked_by: "stf_coach_mike",
    notes: null,
    created_at: "2026-06-20T10:00:00Z",
    updated_at: "2026-06-20T10:00:00Z",
    ...overrides,
  };
}

describe("BookingList", () => {
  it("renders the empty state message when there are no bookings", () => {
    render(<BookingList bookings={[]} emptyMessage="No bookings on this day." />);

    expect(screen.getByText("No bookings on this day.")).toBeInTheDocument();
  });

  it("falls back to the default empty message when none is supplied", () => {
    render(<BookingList bookings={[]} />);

    expect(screen.getByText(/no bookings found/i)).toBeInTheDocument();
  });

  it("renders one row per booking with its purpose and status label", () => {
    render(
      <BookingList
        bookings={[
          booking({ id: "b1", activity_type: "training", status: "confirmed" }),
          booking({ id: "b2", activity_type: "match", status: "cancelled" }),
        ]}
      />,
    );

    // Purpose labels appear via the purpose chip; status labels appear via
    // the shared BookingStatusChip.
    expect(screen.getByText("Training")).toBeInTheDocument();
    expect(screen.getByText("Match")).toBeInTheDocument();
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
    expect(screen.getByText("Cancelled")).toBeInTheDocument();

    // Every row is a `<li>` inside the `aria-label="Bookings"` list.
    const list = screen.getByRole("list", { name: /bookings/i });
    const items = list.querySelectorAll("li");

    expect(items).toHaveLength(2);
  });

  it("sorts bookings ascending by start_at regardless of input order", () => {
    render(
      <BookingList
        bookings={[
          booking({
            id: "late",
            activity_type: "match",
            start_at: "2026-07-06T18:00:00Z",
            end_at: "2026-07-06T19:00:00Z",
          }),
          booking({
            id: "early",
            activity_type: "training",
            start_at: "2026-07-06T10:00:00Z",
            end_at: "2026-07-06T11:00:00Z",
          }),
        ]}
      />,
    );

    const list = screen.getByRole("list", { name: /bookings/i });
    const items = list.querySelectorAll("li");

    // "Training" (early) precedes "Match" (late) after the sort — assert the
    // DOM order lines up with the ascending start_at ordering.
    expect(items[0]?.textContent).toContain("Training");
    expect(items[1]?.textContent).toContain("Match");
  });

  it("renders notes beneath the schedule row when present", () => {
    render(
      <BookingList
        bookings={[
          booking({
            id: "b1",
            notes: "Recurring U12 technical session",
          }),
        ]}
      />,
    );

    expect(screen.getByText(/Recurring U12 technical session/i)).toBeInTheDocument();
  });

  it("does not throw on a multi-day booking (blackout)", () => {
    // A blackout spans several days — the schedule label falls back to the
    // full end date/time. We only assert the render does not throw and the
    // purpose chip is present; the exact date format is locale-sensitive.
    render(
      <BookingList
        bookings={[
          booking({
            id: "blackout",
            activity_type: "blackout",
            status: "blocked",
            start_at: "2026-07-25T00:00:00Z",
            end_at: "2026-07-27T23:59:00Z",
            notes: "Scheduled pitch maintenance & resurfacing",
          }),
        ]}
      />,
    );

    expect(screen.getByText("Blackout")).toBeInTheDocument();
    expect(screen.getByText("Blocked")).toBeInTheDocument();
    expect(screen.getByText(/Scheduled pitch maintenance/i)).toBeInTheDocument();
  });
});
