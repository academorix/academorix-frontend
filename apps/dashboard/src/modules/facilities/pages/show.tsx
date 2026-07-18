/**
 * @file show.tsx
 * @module modules/facilities/pages/show
 *
 * @description
 * Facility detail — the record's metadata (type, capacity, indoor/outdoor,
 * cost) shown as a card, followed by the "upcoming bookings" agenda (the
 * next 30 days of resource bookings for this facility). A "New booking"
 * button in the header links out to the facility's own bookings page.
 */

import { Button, Card, Chip, Spinner } from "@stackra/ui/react";
import { useList, useShow } from "@refinedev/core";
import { useMemo } from "react";
import { Link } from "@stackra/routing/react";

import type { Facility, ResourceBooking } from "@/modules/facilities/facilities.types";
import type { Branch } from "@/types";
import type { ReactNode } from "react";

import { ShowView } from "@/components/refine";
import { formatDate, formatMoney } from "@/lib/format";
import { BookingList } from "@/modules/facilities/components/booking-list";
import { FacilityCapacityBadge } from "@/modules/facilities/components/facility-capacity-badge";
import { FacilityTypeChip } from "@/modules/facilities/components/facility-type-chip";
import { FACILITY_TYPE_LABELS } from "@/modules/facilities/facilities.types";

/** The number of days ahead the "upcoming" agenda covers. */
const UPCOMING_WINDOW_DAYS = 30;

/** A single labelled detail field, styled to match the other module show views. */
function Field({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium tracking-wide text-muted uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

/** The facility detail page. */
export default function FacilityShow(): ReactNode {
  const { result: facility, query } = useShow<Facility>({ resource: "facilities" });

  // Resolve the facility's branch so the detail card can show the branch name
  // rather than the raw UUID. Fetched with pagination off — the branch list is
  // small and this keeps the layout consistent with the leads/branches modules.
  const { result: branchesResult } = useList<Branch>({
    resource: "branches",
    pagination: { mode: "off" },
  });

  // Bookings within the next 30 days. Refine's `queryOptions.enabled` gates
  // the request until we have the facility id, avoiding an initial 404-ish
  // request against `?filter[resource_id]=`.
  const now = useMemo(() => new Date().toISOString(), []);
  const upcomingCutoff = useMemo(() => {
    const cutoff = new Date();

    cutoff.setDate(cutoff.getDate() + UPCOMING_WINDOW_DAYS);

    return cutoff.toISOString();
  }, []);

  const { result: bookingsResult } = useList<ResourceBooking>({
    resource: "resource-bookings",
    pagination: { mode: "off" },
    filters: [
      { field: "resource_id", operator: "eq", value: facility?.id ?? "" },
      { field: "start_at", operator: "gte", value: now },
      { field: "start_at", operator: "lte", value: upcomingCutoff },
    ],
    sorters: [{ field: "start_at", order: "asc" }],
    queryOptions: { enabled: Boolean(facility?.id) },
  });
  const bookings = bookingsResult?.data ?? [];

  if (query.isLoading || !facility) {
    return (
      <ShowView resource="facilities">
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      </ShowView>
    );
  }

  const branchName =
    branchesResult?.data?.find((branch) => branch.id === facility.branch_id)?.name ??
    facility.branch_id;

  const openingHours = facility.opening_hours
    ? // The fixture stores days as an object keyed by weekday; render the
      // populated days on a single line so the detail card stays compact.
      Object.entries(facility.opening_hours)
        .filter(([, value]) => Boolean(value))
        .map(([day, hours]) => `${day}: ${hours ?? ""}`)
        .join("  ·  ")
    : null;

  return (
    <ShowView
      // The "New booking" button links to the facility's bookings page where
      // the agenda + booking creation live. Kept as a `Link`-wrapped Button so
      // React Router owns navigation instead of using the useNavigate hook
      // (matches the pattern used by other module detail pages).
      headerActions={
        <Button size="sm" variant="secondary">
          <Link to={`/facilities/${facility.id}/bookings`}>New booking</Link>
        </Button>
      }
      resource="facilities"
    >
      <div className="flex flex-col gap-6">
        <Card>
          <Card.Header>
            <Card.Title>{facility.name}</Card.Title>
            <Card.Description>
              <div className="flex flex-wrap items-center gap-2">
                <FacilityTypeChip type={facility.type} />
                <Chip color={facility.is_active ? "success" : "default"} size="sm" variant="soft">
                  {facility.is_active ? "Active" : "Inactive"}
                </Chip>
              </div>
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Type">{FACILITY_TYPE_LABELS[facility.type]}</Field>
              <Field label="Branch">{branchName}</Field>
              <Field label="Capacity">
                <FacilityCapacityBadge facility={facility} variant="inline" />
              </Field>
              <Field label="Indoor">
                {facility.indoor === null || facility.indoor === undefined
                  ? // TODO(backend-endpoint): the fixture does not yet ship
                    // the `indoor` column; renders "—" until backend surfaces it.
                    "—"
                  : facility.indoor
                    ? "Indoor"
                    : "Outdoor"}
              </Field>
              <Field label="Hourly cost">
                {formatMoney((facility.hourly_cost_minor / 100).toFixed(2), facility.currency)}
              </Field>
              <Field label="Currency">{facility.currency}</Field>
              <Field label="Feature flag">{facility.feature_flag ?? "—"}</Field>
              <Field label="Created">{formatDate(facility.created_at)}</Field>
              <Field label="Updated">{formatDate(facility.updated_at)}</Field>
            </dl>

            {openingHours ? (
              <div className="mt-6 flex flex-col gap-1">
                <dt className="text-xs font-medium tracking-wide text-muted uppercase">
                  Opening hours
                </dt>
                <dd className="text-sm text-foreground">{openingHours}</dd>
              </div>
            ) : null}

            {facility.notes ? (
              <div className="mt-6 flex flex-col gap-1">
                <dt className="text-xs font-medium tracking-wide text-muted uppercase">Notes</dt>
                <dd className="text-sm whitespace-pre-line text-foreground">{facility.notes}</dd>
              </div>
            ) : null}
          </Card.Content>
        </Card>

        <section aria-label="Upcoming bookings" className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-foreground">Upcoming bookings</h2>
            <span className="text-sm text-muted">Next {UPCOMING_WINDOW_DAYS} days</span>
          </div>
          <BookingList bookings={bookings} emptyMessage="No upcoming bookings for this facility." />
        </section>
      </div>
    </ShowView>
  );
}
