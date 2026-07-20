# platform/facility — Phase 3 implementation status

## Status: SCAFFOLDED — model + interface landed; CRUD + booking flow pending

## What landed

- `Facility` model + `FacilityInterface` — the bookable resource.
  Carries `tenant_id`, `branch_id` (cascades org + region through
  branch), `type` (`court` / `field` / `room` / `pool` / `studio`),
  `name`, `capacity`, `status`, plus the pricing sub-shape
  (`price_per_hour_minor`, `peak_multiplier`, `peak_start`,
  `peak_end`).
- `Booking` model — held reservation rows against a facility for a
  time window. Constraint: unique `(facility_id, starts_at,
  ends_at)` — the DB enforces no double-booking.
- `Pass` — single-visit admission tokens (day pass, guest pass).

## What's pending

### Actions to complete

- Full CRUD on `Facility` — `CreateFacility`, `UpdateFacility`,
  `ShowFacility`, `ListFacilities`, `DeleteFacility`.
- Booking flow —
  `CreateBooking` (POST `/api/v1/facilities/{facility}/bookings`) —
  reserves a time window. Runs the double-booking check inside a
  transaction with a `SELECT ... FOR UPDATE` on the facility row.
  `CancelBooking` — releases the slot. Refund policy honours the
  configured cancellation window.
- `ListMyBookings` (GET `/api/v1/tenant/bookings/mine`) — the
  caller's active + past reservations.
- `CalculatePricingAction` (GET
  `/api/v1/facilities/{facility}/pricing`) — reads the pricing
  sub-shape + the requested time window + applies the
  peak-multiplier + returns the total cents.
- Pass management — `IssuePass`, `RedeemPass`, `ListPasses`.

### Services

- `PricingCalculator` — encapsulates the peak-multiplier logic.
  Reusable outside the action.
- `DoubleBookingGuard` — the transactional lock + overlap check.
  Fires `FacilityBookingRefused` on collision.
- `AvailabilityResolver` — given a date range, returns the free
  windows for a facility (subtracts blackouts + bookings + closed
  branch hours).

### Domain events

- `FacilityCreated` / `FacilityUpdated` / `FacilityArchived`.
- `BookingCreated` / `BookingConfirmed` / `BookingCancelled` /
  `BookingRefused` / `BookingCompleted`.
- `PassIssued` / `PassRedeemed` / `PassExpired`.

### Cross-module dependencies

- **`platform/branch`** — Facility.branch_id references Branch.
- **`billing/entitlements`** — `facilities` feature flag gates
  Small tier out of the module entirely; `facilities_advanced`
  gates peak-multiplier + blackouts + packages.
- **`finance/payment`** — Booking creation triggers a payment
  intent via `PaymentGatewayManager::createIntent`.
- **`notifications/notifications`** — booking confirmation +
  reminder + cancellation dispatch.

## Backlog priorities

1. **P0 — Full CRUD** (unblocks Medium tier onboarding — Small
   tier does not have facilities).
2. **P0 — Booking flow with double-booking guard.**
3. **P1 — Pricing calculator + peak-multiplier.**
4. **P2 — Pass management.**
