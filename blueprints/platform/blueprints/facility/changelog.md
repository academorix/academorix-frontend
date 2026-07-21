# facility — changelog

## [Unreleased] — inception (Wave 2b)

- Facility module authored. Four owned entities:
  - `Facility` — the resource catalogue (courts, fields, pools, studios, rooms,
    gym floors, lanes, general).
  - `ResourceBooking` — timed reservations against a facility.
  - `DayPass` — untimed same-day admission (branch-scoped POS record).
  - `Pass` — Membership-linked (Wave 4) credit + eligibility record.
- Two entitlement gates:
  - `facilities` (boolean) — master feature gate. Off on Small tier.
  - `facilities_advanced` (boolean) — day_passes + passes + recurring + blackout
    cascades. Enterprise-only.
- Slot cap: `facility_slot` (Medium: 20, Enterprise: unlimited).
- Booking state machine: pending → confirmed → completed / cancelled / no_show.
  Auto-confirm default in Wave 2.
- Overlap detection under SERIALIZABLE isolation + weekly reconciler audit.
  `stackra.facility.overlaps.detected` counter must stay at 0.
- Cascade paths: FacilityRetired → future bookings cancelled;
  FacilityBlackoutAdded → in-window bookings cancelled; RegionPaused →
  facilities transitioned to maintenance; TenantErased → FK CASCADE.
- Pricing via `pricing_json` — four models (per_hour, per_slot, per_person,
  included_in_membership). Prices frozen on booking. Every mutation writes to
  audits with 7-year financial-record retention.
- Availability via `availability_json` — recurring weekly hours within parent
  Branch envelope.
- Blackouts via `blackout_dates` — one-off windows that cascade-cancel affected
  bookings.
- Anonymous day-pass walk-in profile fields (name + phone + age_band) redacted
  90 days post-consumption per GDPR Art. 5(1)(c).
- Reconciler jobs: `ReconcileBookingOverlapsJob` +
  `ReconcileBookingsAgainstRetiredFacilitiesJob`. Weekly. Both counters must
  stay at 0.
- Realtime broadcasts: `tenant.{id}.facilities`, `facility.{id}.bookings`,
  `user.{id}.bookings`.
- Nine notification categories (booking-confirmed, cancelled, reminder, no-show,
  blackout-affects-booking, pass-issued, pass-exhausted, pass-expiring,
  pass-revoked).
- SDUI: 4 facility screens + 3 booking screens + 1 day-pass POS screen + 1 pass
  list + 4 widgets.

### Compatibility

- Depends on `foundation`, `tenancy`, `organization`, `region`, `branch`,
  `application`, `entitlements`, `notifications`.
- Extended by `sports` (Wave 3 — sessions compose ResourceBooking) and `finance`
  (Wave 4 — invoicing + Membership→Pass provisioning).
- Wave 2b inception release.

### Design notes

- Facility does NOT carry `organization_id` / `region_id` / `application_id`.
  All three cascade through `branch_id`. Enforced by tenancy-compliance-auditor.
- ResourceBooking does NOT carry `branch_id`. Cascades through
  `facility.branch_id`. Denormalisation deferred until proven necessary.
- DayPass carries `branch_id` directly (branch-scoped POS record; not tied to
  any specific facility).
- Pass carries `branch_id` + optional `facility_id` (facility-specific or
  branch-wide).
- The SERIALIZABLE overlap check is the primary invariant. Downgrade only in
  test envs; production must stay SERIALIZABLE.
- `resource_bookings` is the write-side of Wave 3+ session scheduling.
  Sports::Session composes it rather than duplicating the reservation primitive.
- Wave 2 does NOT ship recurring booking rules. The entitlement key + SDUI
  toggle exist; the `recurring_booking_rules` table lands in Wave 2b.
- Wave 2 ships `Pass.membership_id` as a nullable placeholder. Wave 4 Finance
  wires the auto-provisioning listener.
