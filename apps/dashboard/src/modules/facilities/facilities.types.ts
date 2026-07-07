/**
 * @file facilities.types.ts
 * @module modules/facilities/facilities.types
 *
 * @description
 * Module-local shapes for **Facilities & Resource Booking** — bookable venues
 * (pitches, pools, courts, gyms) and the calendar of activities booked against
 * them. Kept local because these are cross-cutting resources owned by a single
 * feature module; both models are tenant-scoped and pinned to a branch so the
 * primary lists reflect the active branch switcher.
 *
 * The field names mirror the JSON contract emitted by the backend Facilities
 * module (`backend/modules/Facilities/database/fixtures/*.json`) byte-for-byte
 * — every downstream `useList<Facility>({ resource: "facilities" })` and
 * `useList<ResourceBooking>({ resource: "resource-bookings" })` call therefore
 * hits `GET /api/v1/facilities` and `GET /api/v1/resource-bookings` with no
 * runtime translation layer.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §13.6 "Facility & Resource Booking"
 * @see backend/modules/Facilities/routes/tenant.php
 */

import type { BaseModel, TenantScoped } from "@/types";

/**
 * The kind of bookable resource a facility represents. The list is a
 * deliberate superset of what the current fixture ships (`pitch`, `pool`,
 * `court`, `equipment`) plus every physical venue category the module blueprint
 * anticipates (`gym`, `studio`, `classroom`, `track`, `other`). `equipment` is
 * intentionally kept so the mock fixture round-trips.
 */
export const FACILITY_TYPES = [
  "pitch",
  "pool",
  "court",
  "gym",
  "studio",
  "classroom",
  "track",
  "equipment",
  "other",
] as const;

/** A single facility type (e.g. `"pitch"`). */
export type FacilityType = (typeof FACILITY_TYPES)[number];

/** Human-readable labels for {@link FacilityType}. */
export const FACILITY_TYPE_LABELS: Record<FacilityType, string> = {
  pitch: "Pitch",
  pool: "Pool",
  court: "Court",
  gym: "Gym",
  studio: "Studio",
  classroom: "Classroom",
  track: "Track",
  equipment: "Equipment",
  other: "Other",
};

/**
 * Weekly opening-hours schedule as returned by the backend. Days omitted are
 * treated as closed. Values are `"HH:MM-HH:MM"` local-time strings; parsing/
 * validation is delegated to whichever module surface renders the schedule.
 */
export interface FacilityOpeningHours {
  mon?: string;
  tue?: string;
  wed?: string;
  thu?: string;
  fri?: string;
  sat?: string;
  sun?: string;
}

/**
 * A **Facility** — a bookable physical resource (pitch, pool, court, gym, …)
 * belonging to a branch. Backed by `GET /api/v1/facilities`.
 *
 * @remarks
 * The task spec references `unit_of_capacity`, `indoor`, and `notes` columns
 * that the backend fixture does not currently emit — those are surfaced as
 * optional/nullable here and flagged with a `TODO(backend-endpoint)` at the
 * call sites that would need them. Frontend code never fabricates values for
 * missing columns; it renders `"—"` when the column is absent.
 *
 * @see backend/modules/Facilities/database/fixtures/facilities.json
 */
export interface Facility extends BaseModel, TenantScoped {
  /** Owning branch id (scope dimension for the primary list). */
  branch_id: string;
  /** Kind of resource, used for icon + filter + labelling. */
  type: FacilityType;
  /** Human-readable facility name shown in lists and details. */
  name: string;
  /**
   * Backend feature-flag key the facility opts into (blueprint §13.6). Almost
   * always the literal `"facilities"`; kept as a plain string to avoid a
   * cross-module coupling on the feature-flag catalogue.
   */
  feature_flag: string | null;
  /** Peak simultaneous occupancy allowed by the venue. */
  capacity: number;
  /**
   * How to interpret {@link Facility.capacity} — `"people"` for a pool lane,
   * `"players"` for a pitch, etc. Nullable because the fixture does not yet
   * ship this column.
   *
   * TODO(backend-endpoint): add `unit_of_capacity` to
   * `backend/modules/Facilities/src/Models/Facility.php` + fixture.
   */
  unit_of_capacity: string | null;
  /**
   * `true` if the venue is enclosed. Nullable because the fixture does not
   * yet ship this column.
   *
   * TODO(backend-endpoint): add `indoor` boolean to
   * `backend/modules/Facilities/src/Models/Facility.php` + fixture.
   */
  indoor: boolean | null;
  /** Weekly opening hours; days omitted are closed. */
  opening_hours: FacilityOpeningHours | null;
  /** Hourly cost expressed in the smallest currency unit (cents). */
  hourly_cost_minor: number;
  /** ISO-4217 currency code, e.g. `"USD"`. */
  currency: string;
  /** Whether the facility is currently bookable. */
  is_active: boolean;
  /**
   * Free-text operational notes (surge conditions, maintenance quirks, …).
   *
   * TODO(backend-endpoint): the fixture uses an underscore-prefixed
   * `_note` field for module comments; a first-class `notes` column would
   * let coaches capture facility-specific instructions.
   */
  notes: string | null;
}

/**
 * The kind of activity a {@link ResourceBooking} represents on the calendar.
 * Mirrors the fixture's `activity_type` enumeration plus a small superset for
 * the private-hire + maintenance verticals called out in the module spec.
 */
export const BOOKING_PURPOSES = [
  "training",
  "match",
  "session",
  "event",
  "blackout",
  "maintenance",
  "private_hire",
] as const;

/** A single booking purpose (e.g. `"training"`). */
export type BookingPurpose = (typeof BOOKING_PURPOSES)[number];

/** Human-readable labels for {@link BookingPurpose}. */
export const BOOKING_PURPOSE_LABELS: Record<BookingPurpose, string> = {
  training: "Training",
  match: "Match",
  session: "Session",
  event: "Event",
  blackout: "Blackout",
  maintenance: "Maintenance",
  private_hire: "Private Hire",
};

/**
 * Lifecycle of a {@link ResourceBooking}. Mirrors the fixture's `status`
 * enumeration plus the `"pending"` state the blueprint expects once approval
 * workflows land.
 */
export const BOOKING_STATUSES = ["pending", "confirmed", "cancelled", "blocked"] as const;

/** A single booking status (e.g. `"confirmed"`). */
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** Human-readable labels for {@link BookingStatus}. */
export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  blocked: "Blocked",
};

/**
 * A **ResourceBooking** — a scheduled use of a facility (training, match,
 * private hire, maintenance blackout, …). Backed by
 * `GET /api/v1/resource-bookings`.
 *
 * @remarks
 * The primary "which facility" pointer is `resource_id` on the backend — not
 * `facility_id`. Kept snake_case to preserve JSON parity.
 *
 * @see backend/modules/Facilities/database/fixtures/resource-bookings.json
 */
export interface ResourceBooking extends BaseModel, TenantScoped {
  /** Facility this booking reserves (the `Facility.id`). */
  resource_id: string;
  /** Kind of activity — matches the `BookingPurpose` union. */
  activity_type: BookingPurpose;
  /**
   * External record this booking is linked to (a training id, a match id, a
   * blackout token, …). Nullable when the booking is a stand-alone hold.
   */
  activity_id: string | null;
  /** ISO-8601 start timestamp. */
  start_at: string;
  /** ISO-8601 end timestamp. */
  end_at: string;
  /** Lifecycle status. */
  status: BookingStatus;
  /**
   * Principal id (user or staff) who created the booking. Kept as a plain
   * string so the field can hold either a user id (task-spec name
   * `booked_by_user_id`) or a staff id, as observed in the fixture.
   */
  booked_by: string | null;
  /** Free-text booking note (justification, opponent, warm-up plan, …). */
  notes: string | null;
  /** Optional coach id when the booking is coach-owned. */
  coach_id?: string | null;
  /**
   * Optional branch id copied from the parent facility, for filtering when
   * bookings are queried across facilities.
   */
  branch_id?: string | null;
  /** Human-readable reason a `blocked` booking exists (maintenance, …). */
  blocked_reason?: string | null;
  /** Id of the booking this one conflicts with, when the API surfaces one. */
  conflicting_booking_id?: string | null;
  /** Id of an escalation task raised on conflict. */
  escalation_task_id?: string | null;
}
