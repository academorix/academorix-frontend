/**
 * @file bookings.tsx
 * @module modules/facilities/pages/bookings
 *
 * @description
 * Bookings calendar/agenda for a single facility. Renders a weekly agenda
 * grouped by day (a full week-view calendar is the nice-to-have; this is the
 * minimum required by the spec — an agenda list ordered chronologically, one
 * section per day for the currently-shown week).
 *
 * The page reads the facility id from the router and fetches the associated
 * bookings via `/api/v1/resource-bookings?filter[resource_id]=…`. Week
 * navigation is client-only: the fetched window covers the current week ±
 * one, so previous/next behaves like a paged view without extra requests
 * per click.
 */

import { ArrowLeftIcon, ArrowRightIcon, CalendarDaysIcon } from "@academorix/ui/icons/outline";
import { Button, Card, Spinner } from "@academorix/ui/react";
import { useList, useShow } from "@refinedev/core";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";

import type {
  Facility,
  ResourceBooking,
} from "@/modules/facilities/facilities.types";
import type { ReactNode } from "react";

import { ListView } from "@/components/refine";
import { BookingList } from "@/modules/facilities/components/booking-list";
import { FacilityTypeChip } from "@/modules/facilities/components/facility-type-chip";

/** How many days each agenda page spans. Kept as a week so navigation feels natural. */
const WEEK_DAYS = 7;

/**
 * Returns the ISO date of the week's Monday for a given anchor date. Weeks
 * start on Monday for the agenda so weekend blackouts group naturally at the
 * end of the view.
 */
function startOfWeek(anchor: Date): Date {
  const start = new Date(anchor);

  // JS getDay() returns 0 (Sun) — 6 (Sat). Rotate so Monday becomes day 0.
  const dayOffset = (start.getDay() + 6) % 7;

  start.setDate(start.getDate() - dayOffset);
  start.setHours(0, 0, 0, 0);

  return start;
}

/** Returns the ISO date `days` days after `date`. */
function addDays(date: Date, days: number): Date {
  const next = new Date(date);

  next.setDate(next.getDate() + days);

  return next;
}

/**
 * Groups the bookings by local YYYY-MM-DD start date. The Map preserves
 * insertion order so we render days chronologically even when the input
 * array is un-sorted.
 */
function groupByDay(
  bookings: ResourceBooking[],
  weekStart: Date,
): Array<{ key: string; date: Date; label: string; rows: ResourceBooking[] }> {
  const map = new Map<string, ResourceBooking[]>();

  for (const booking of bookings) {
    // Pin the group key to the *start* day; multi-day blackouts appear only
    // in the day they begin, which matches how a coach reads the schedule.
    const dayKey = booking.start_at.slice(0, 10);
    const existing = map.get(dayKey);

    if (existing) {
      existing.push(booking);
    } else {
      map.set(dayKey, [booking]);
    }
  }

  // Emit every day in the week (even empty days) so the reader gets a fixed
  // 7-row spine — an empty day renders the BookingList's own empty state.
  return Array.from({ length: WEEK_DAYS }, (_, index) => {
    const date = addDays(weekStart, index);
    const key = date.toISOString().slice(0, 10);

    return {
      key,
      date,
      label: date.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
      }),
      rows: map.get(key) ?? [],
    };
  });
}

/** The bookings page for a single facility. */
export default function FacilityBookings(): ReactNode {
  const { id } = useParams<{ id: string }>();
  const facilityId = id ?? "";

  // Anchor date drives the visible week. Starting at "today" matches how the
  // "New booking" CTA on the detail page expects the user to land here.
  const [anchor, setAnchor] = useState<Date>(() => new Date());

  const weekStart = useMemo(() => startOfWeek(anchor), [anchor]);
  const weekEnd = useMemo(() => addDays(weekStart, WEEK_DAYS - 1), [weekStart]);

  const { result: facility, query: facilityQuery } = useShow<Facility>({
    resource: "facilities",
    id: facilityId,
    queryOptions: { enabled: Boolean(facilityId) },
  });

  // The bookings window uses inclusive bounds on both ends so a blackout that
  // begins the final day of the week still shows up.
  const { result: bookingsResult, query: bookingsQuery } = useList<ResourceBooking>({
    resource: "resource-bookings",
    pagination: { mode: "off" },
    filters: [
      { field: "resource_id", operator: "eq", value: facilityId },
      { field: "start_at", operator: "gte", value: weekStart.toISOString() },
      {
        field: "start_at",
        operator: "lte",
        value: addDays(weekEnd, 1).toISOString(),
      },
    ],
    sorters: [{ field: "start_at", order: "asc" }],
    queryOptions: { enabled: Boolean(facilityId) },
  });

  const bookings = bookingsResult?.data ?? [];
  const grouped = useMemo(() => groupByDay(bookings, weekStart), [bookings, weekStart]);

  const isLoading = facilityQuery.isLoading || bookingsQuery.isLoading;

  return (
    <ListView
      // The list-view scaffold owns the breadcrumbs + create button; we
      // suppress its native "Create" (there's no plain create for bookings
      // in-scope) by supplying `resource="resource-bookings"` at a route
      // level would double the CTA — so we pass "facilities" and cover the
      // module context via the title.
      resource="facilities"
      title={facility ? `Bookings — ${facility.name}` : "Bookings"}
    >
      <div className="flex flex-col gap-4">
        <Card>
          <Card.Content>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {facility ? <FacilityTypeChip type={facility.type} /> : null}
                <div className="flex items-center gap-1 text-sm text-muted">
                  <CalendarDaysIcon aria-hidden="true" className="size-4" />
                  <span>
                    Week of{" "}
                    {weekStart.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  isIconOnly
                  aria-label="Previous week"
                  size="sm"
                  variant="ghost"
                  onPress={() => setAnchor((current) => addDays(current, -WEEK_DAYS))}
                >
                  <ArrowLeftIcon aria-hidden="true" className="size-4" />
                </Button>
                <Button
                  aria-label="Jump to this week"
                  size="sm"
                  variant="secondary"
                  onPress={() => setAnchor(new Date())}
                >
                  Today
                </Button>
                <Button
                  isIconOnly
                  aria-label="Next week"
                  size="sm"
                  variant="ghost"
                  onPress={() => setAnchor((current) => addDays(current, WEEK_DAYS))}
                >
                  <ArrowRightIcon aria-hidden="true" className="size-4" />
                </Button>
                {facility ? (
                  <Button size="sm" variant="primary">
                    <Link to={`/facilities/${facility.id}`}>Back to facility</Link>
                  </Button>
                ) : null}
              </div>
            </div>
          </Card.Content>
        </Card>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner aria-label="Loading" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {grouped.map((day) => (
              <section key={day.key} aria-label={day.label} className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">
                  {day.label}
                </h3>
                <BookingList
                  bookings={day.rows}
                  emptyMessage="No bookings on this day."
                />
              </section>
            ))}
          </div>
        )}
      </div>
    </ListView>
  );
}
