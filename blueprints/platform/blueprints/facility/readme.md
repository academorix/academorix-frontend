# facility

Bookable resource inside a Branch. Wave 2b infrastructure.

## 1. What this module owns

| Concern                     | Owned artefact                                                                                     |
| --------------------------- | -------------------------------------------------------------------------------------------------- |
| Facility catalogue          | `Facility` (courts, fields, pools, studios, rooms, gym floors, lanes) — always attached to Branch. |
| Timed reservations          | `ResourceBooking` — one row per timed slot booking against a facility.                             |
| Same-day admission          | `DayPass` — untimed pass for casual walk-ins (branch-scoped, not facility-scoped).                 |
| Membership-linked passes    | `Pass` — credit + eligibility record binding Membership (Wave 4) to Facility access.               |
| Blackout windows            | JSONB `blackout_dates` on the Facility row (one-off closures distinct from recurring hours).       |
| Structured availability     | JSONB `availability_json` on the Facility row (per-day windows within Branch hours).               |
| Pricing                     | JSONB `pricing_json` on the Facility row (per-hour, per-slot, per-person, included_in_membership). |
| Overlap detection           | SERIALIZABLE-isolation observer + weekly reconciler audit.                                         |
| Booking lifecycle           | pending → confirmed → completed / cancelled / no-show state machine.                               |
| Available-slots computation | GET `/facilities/{id}/available-slots` — feeds the calendar widget.                                |
| Reception POS               | Day-pass issue + consume endpoints for turnstile / receptionist flows.                             |
| Pass credit management      | Atomic increment on booking-create; expiration + exhaustion + revocation flow.                     |

### 1.1 The four owned tables

- `facilities` — the catalogue. Belongs to `Tenant` + `Branch`. Cascades
  organization + region through branch.
- `resource_bookings` — timed reservations. Belongs to `Tenant` + `Facility`
  (cascades branch/region/org through facility).
- `day_passes` — POS-issued walk-in passes. Belongs to `Tenant` + `Branch`
  (never a specific facility — a walk-in gets access to the whole branch).
- `passes` — credit + eligibility. Belongs to `Tenant` + `Branch` + optional
  `Facility` + optional `Membership` (Wave 4).

None of these carry `application_id`, `organization_id`, or `region_id` — all
cascade through the branch. Enforced by the tenancy-compliance-auditor and by
the observer refusal chains.

## 2. Tier gating

Facility is one of the sharpest tier gates in the platform.

- **Small** — feature DISABLED entirely. `facilities` entitlement is 0 / false.
  The whole `/api/v1/facilities` + `/api/v1/bookings` + `/api/v1/day-passes` +
  `/api/v1/passes` surface returns 402.
- **Medium** — basic booking. Facilities + resource bookings + up to 20
  facilities per tenant. No day passes, no passes, no recurring bookings, no
  blackout cascades.
- **Enterprise** — everything. Day passes, passes, recurring booking rules,
  blackouts with cascade, package integration (Wave 4 Finance), unlimited
  facilities.

The two entitlement keys are:

- `facilities` (boolean) — master feature gate.
- `facilities_advanced` (boolean) — day_passes + passes + advanced features.

Plus `facility_slot` (slot cap, Medium: 20, Enterprise: unlimited).

## 3. The booking lifecycle

The state machine of `resource_bookings.status`:

```
pending  ──(payment/approval resolves)──▶ confirmed  ──(ends_at + 15 min, automated)──▶ completed
   │                                          │
   │                                          ├──(user or admin cancel)──▶ cancelled
   │                                          │
   │                                          ├──(starts_at + 15 min, no check-in, automated)──▶ no_show
   │                                          │
   │                                          └──(facility retired / blackout added, cascaded)──▶ cancelled
   │
   └──(30 min TTL past, automated)──▶ cancelled
```

Terminal states: `completed`, `cancelled`, `no_show`. No transitions leave them.

**Auto-confirm is the default in Wave 2** — bookings that don't require Wave 4
Finance approval go straight to `confirmed`. The pending state is reserved for
future approval flows.

## 4. The overlap check

This is the module's load-bearing invariant. Overlap detection runs inside a DB
transaction under SERIALIZABLE isolation:

```sql
BEGIN;
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

SELECT id
FROM resource_bookings
WHERE facility_id = ?
  AND status IN ('pending', 'confirmed')
  AND deleted_at IS NULL
  AND tsrange(starts_at, ends_at) && tsrange(new.starts_at, new.ends_at)
FOR UPDATE;

-- if any row returns: refuse with BOOKING_OVERLAP
-- else: INSERT the new booking

COMMIT;
```

SERIALIZABLE prevents concurrent requests from both passing the check and both
inserting overlapping rows. If the isolation guarantee ever fails (raw SQL
bypass, engine downgrade, corrupted index), the weekly
`ReconcileBookingOverlapsJob` catches the drift and fires
`BookingOverlapDetected` — a P1 event.

The `academorix.facility.overlaps.detected` counter should stay at 0 for the
lifetime of a healthy platform.

## 5. Cascades

The module ships several cascades that all fire `BookingCancelled` per affected
booking:

- `FacilityRetired` → `CancelFutureBookingsOnFacilityRetired` → every future
  booking cancelled with `cascade_trigger='facility_retired'`.
- `FacilityBlackoutAdded` → `CancelBookingsInBlackoutWindow` → bookings inside
  the window cancelled with `cascade_trigger='facility_blackout'`.
- `RegionPaused` → `FreezeNewBookingsInRegion` → facilities in region
  transitioned to `maintenance` (existing bookings survive).
- `TenantErased` → `PurgeFacilityDataForErasedTenant` → FK CASCADE hard-deletes
  every row (audit trails survive).
- `MembershipTerminated` (Wave 4) → `CascadePassesOnMembershipTerminated` →
  linked passes revoked.

Cancelled bookings notify the booker (cannot-opt-out on cascade cancels — the
tenant needs to react).

## 6. Pricing

`pricing_json` on the Facility row supports four models:

- `per_hour` — rate × booking hours × attendees_count.
- `per_slot` — flat rate per booking regardless of duration.
- `per_person` — rate × attendees_count regardless of duration.
- `included_in_membership` — price 0; pass credit required.

Optional `peak_hours` sub-map applies a multiplier to certain day/hour windows.
Optional `tiers` array supports member-vs-guest rates.

Every pricing change writes to `audits` with 7-year retention. Existing bookings
retain their frozen `price_amount_cents` — subsequent edits do NOT retroactively
reprice.

## 7. Availability + blackouts

Two distinct concepts:

- `availability_json` — recurring weekly hours. Shape:
  `{ monday: [{starts: 'HH:MM', ends: 'HH:MM'}], ..., sunday: [...] }`. MUST be
  within the parent Branch's `opening_hours` envelope (observer enforces).
- `blackout_dates` — one-off windows. Shape:
  `[{starts_at: ISO8601, ends_at: ISO8601, reason: string}]`. Adding a blackout
  cascades: bookings inside the window are cancelled.

## 8. Day passes

Branch-scoped POS record. Two flavours:

- **Registered walk-in** — `issued_to_user_id` set. Follows normal user
  retention.
- **Anonymous walk-in** — `issued_to_profile_name` + `_phone` + `_age_band`
  captured at issuance for operational necessity (lost-property callbacks,
  safety incidents). Redacted 90 days post-consumption per GDPR Art. 5(1)(c)
  minimisation.

Every DayPass gets a `receipt_number` in the tenant's yearly sequence. Refund
window: 30 days from purchase, only when unconsumed.

## 9. Passes

The credit + eligibility bridge between Membership (Wave 4) and Facility. A pass
grants:

- N `total_credits` (facility uses).
- Valid between `valid_from` and `valid_until`.
- Applicable to a specific `facility_id` OR any facility in the `branch_id`
  (when facility_id IS NULL).
- Assignable to one or more users via `assignable_user_ids`.
- Optionally `is_transferable` — assignable_user_ids can change after issuance.

Credits decrement atomically on booking-create (SELECT ... FOR UPDATE inside the
booking transaction). Over-consumption is refused at the observer — every
attempted double-spend is a P1 signal (`PASS_DOUBLE_SPEND` error,
`academorix.facility.passes.double_spend_attempts_total` counter).

## 10. What this module does NOT do

- **Cross-branch bookings.** A booking references one facility; a facility
  belongs to one branch. Multi-branch bookings are non-goals for Wave 2.
- **Cross-facility passes across branches.** A pass is branch-scoped.
  Multi-branch passes are deferred.
- **Recurring booking rules.** The `booking_recurring` entitlement key ships in
  Wave 2 but the `recurring_booking_rules` table lands in Wave 2b.
- **Payment processing.** Wave 4 Finance module owns the payment side. The
  facility module attaches `payment_status` fields as forward-compatible
  placeholders.
- **Session management.** Wave 3 Sports module composes `ResourceBooking` for
  team practices + tournaments. This module owns the reservation primitive only.
- **Pricing auto-migration on region currency change.** `pricing_json.currency`
  is frozen at facility creation. Region currency changes require manual
  re-price via the pricing endpoint.
- **Anonymous walk-in without name+phone.** Data-quality mandate — every
  anonymous day-pass captures at least a name + phone.
- **Manual booking completion.** The `completed` state is system-managed
  (automated MarkBookingCompletedJob). Manual completion is refused by the
  observer.

## 11. Cross-references

- `hierarchy.md` §2 — where facility sits in the platform tree (below Branch).
- `hierarchy.md` §7 — tier matrix (facilities off on Small, basic on Medium,
  advanced on Enterprise).
- `hierarchy.md` §13 — non-goals (facilities never carry organization_id).
- `hierarchy.md` §14 — belongs-to matrix.
- `tenancy-columns.md` §3 — every owned row carries `tenant_id` + `branch_id`
  (facility, day_pass, pass) or cascades through facility (resource_booking).
- `tenancy-columns.md` §5 — forbidden columns (facility never carries
  organization_id, region_id, application_id).
- `modules/platform/blueprints/branch/` — the parent branch module
  (opening_hours envelope).
- `modules/platform/blueprints/region/` — regional currency + timezone consumed
  by pricing + timezone-aware timing.
- `modules/workflow/blueprints/approvals/` — Wave 4 approval flow that will gate
  the `pending → confirmed` transition for high-value bookings.
- `modules/shared/blueprints/localization/` — the module's user-facing strings
  (booking status names, facility_type labels) are translated via
  `HasTranslations` on future admin-facing catalogue tables.
