/**
 * @file booking-list.tsx
 * @module modules/facilities/components/booking-list
 *
 * @description
 * Reusable agenda-style list of {@link ResourceBooking} rows: one line per
 * booking, ordered chronologically, with the activity's purpose, its status,
 * and the local start/end times. Used on the facility detail page ("upcoming
 * bookings") and on the dedicated bookings page (grouped agenda).
 *
 * Callers pass a plain array of bookings; the component does no fetching so
 * it can be reused inside modals, drawers, and read-only detail rows without
 * bringing a Refine query along for the ride.
 */

import { Chip, EmptyState, Separator } from "@academorix/ui/react";

import type {
  BookingPurpose,
  ResourceBooking,
} from "@/modules/facilities/facilities.types";
import type { ReactNode } from "react";

import { formatDateTime } from "@/lib/format";
import { BookingStatusChip } from "@/modules/facilities/components/booking-status-chip";
import { BOOKING_PURPOSE_COLOR } from "@/modules/facilities/facilities.config";
import { BOOKING_PURPOSE_LABELS } from "@/modules/facilities/facilities.types";

/** Sorts bookings ascending by `start_at`. */
function byStart(a: ResourceBooking, b: ResourceBooking): number {
  return a.start_at.localeCompare(b.start_at);
}

/** Builds the "Jul 8, 3:00 PM → 4:00 PM" schedule label for a single row. */
function toScheduleLabel(booking: ResourceBooking): string {
  const start = formatDateTime(booking.start_at);
  // The end column is rendered as time-only when it happens on the same
  // calendar day; otherwise we show the full date+time so the reader is not
  // confused by an overnight or multi-day booking (a blackout, typically).
  const end = new Date(booking.end_at);
  const startDate = new Date(booking.start_at);

  if (
    !Number.isNaN(end.getTime()) &&
    !Number.isNaN(startDate.getTime()) &&
    end.toDateString() === startDate.toDateString()
  ) {
    return `${start} → ${end.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  }

  return `${start} → ${formatDateTime(booking.end_at)}`;
}

/** Renders a small colored chip for the booking's activity type. */
function PurposeChip({ purpose }: { purpose: BookingPurpose }): ReactNode {
  return (
    <Chip color={BOOKING_PURPOSE_COLOR[purpose]} size="sm" variant="soft">
      {BOOKING_PURPOSE_LABELS[purpose]}
    </Chip>
  );
}

/** Props for {@link BookingList}. */
export interface BookingListProps {
  /** The bookings to render (unsorted; the component sorts them ascending). */
  bookings: ResourceBooking[];
  /**
   * Message shown when {@link BookingListProps.bookings} is empty. Kept
   * caller-controlled so the two use sites ("no upcoming bookings" vs "no
   * bookings on this facility") can pick their own tone.
   */
  emptyMessage?: string;
  /**
   * Whether the list should include a `Separator` between rows. Defaults to
   * `true`; drawers that want a denser look pass `false`.
   */
  showSeparators?: boolean;
}

/**
 * A vertically-stacked agenda list of resource bookings. Empty state renders a
 * compact {@link EmptyState}; non-empty renders one row per booking with the
 * purpose chip, the schedule range, and a right-aligned status chip.
 *
 * @param props - The bookings and optional presentation switches.
 */
export function BookingList({
  bookings,
  emptyMessage = "No bookings found.",
  showSeparators = true,
}: BookingListProps): ReactNode {
  if (bookings.length === 0) {
    return (
      <EmptyState size="sm">
        <EmptyState.Header>
          <EmptyState.Title>{emptyMessage}</EmptyState.Title>
        </EmptyState.Header>
      </EmptyState>
    );
  }

  // Copy before sort so the caller's array reference is not mutated (React
  // strict-mode double-render safety net).
  const sorted = [...bookings].sort(byStart);

  return (
    <ul
      aria-label="Bookings"
      className="flex flex-col rounded-lg border border-border bg-surface"
    >
      {sorted.map((booking, index) => (
        <li key={booking.id} className="flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex items-center gap-2">
                <PurposeChip purpose={booking.activity_type} />
                <span className="truncate text-sm font-medium text-foreground">
                  {toScheduleLabel(booking)}
                </span>
              </div>
              {booking.notes ? (
                <p className="text-xs whitespace-pre-line text-muted">{booking.notes}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <BookingStatusChip status={booking.status} />
            </div>
          </div>
          {showSeparators && index < sorted.length - 1 ? <Separator /> : null}
        </li>
      ))}
    </ul>
  );
}
