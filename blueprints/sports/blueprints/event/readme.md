# event

Sport competitive / social / educational event — the row that answers "what's
happening at our tenant on date X?". Wave 3b of the sports tier (priority 62).

## 1. What this module owns

| Concern                           | Owned artefact                                                                                                                                                            |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Event aggregate                   | `Event` (`events.tenant_id` + required `organization_id` + nullable `branch_id` + nullable `season_id`)                                                                   |
| Facility composition              | `EventFacility` pivot (`event_facilities`) — attaches N facilities to one event with purpose + primary flag                                                               |
| Type catalog                      | `data/event-type-catalog.json` — 11 event_types with typical durations + compatible formats                                                                               |
| Format catalog                    | `data/event-format-catalog.json` — 9 formats + their compatible event_types                                                                                               |
| Automatic phase transitions       | `RollEventStatusJob` — hourly cron; transitions status based on now() vs registration + start + end timestamps                                                            |
| Registration window closure       | `ExpireExpiredEventRegistrationsJob` — every 15 min for prompt closure                                                                                                    |
| Reminder cadence                  | `NotifyEventReminderJob` — T-24h + T-1h before starts_at                                                                                                                  |
| Facility booking reconciler       | `ReconcileEventFacilityBookingsJob` — nightly; ties event_facilities to facility::ResourceBooking                                                                         |
| Cancellation broadcast            | `EventCancellationBroadcast` — cannot-opt-out fan-out to every registered participant + guardian for minors                                                               |
| Tenant surface                    | Full CRUD on `/api/v1/events` + lifecycle actions + facilities pivot                                                                                                      |
| Platform-admin surface            | Cross-tenant read + force-cancel escape hatch                                                                                                                             |
| `BelongsToEvent` trait            | For Session (Wave 3b), teams::EventTeam (Wave 2b nullable), athlete-enrollment (Wave 3+)                                                                                  |
| `event.resolve_active`            | X-Event-Id header resolution                                                                                                                                              |
| `event.enforce_registration_open` | Guards Wave 3+ enrollment-adjacent writes                                                                                                                                 |
| Entitlement gates                 | `sports_events` (module master), `event_slot` (per-year cap), `event_public_visibility`, `event_livestream`, `event_prize_pool`, `event_multi_facility`, `event_sponsors` |

### 1.1 Wave 3b lands after Wave 3a (season)

Event depends on Season being on disk (nullable FK — stand-alone events
allowed). Teams (Wave 2b) already ships `EventTeam` with a nullable `event_id`;
Wave 3 will migrate that to required + FK-constrained against `events.id` once
this module lands.

### 1.2 The composition contract with facility

Event composes ResourceBookings via the `event_facilities` pivot, but does NOT
own the booking primitive. When an event attaches a facility via
`event_facilities`, the ReconcileEventFacilityBookingsJob creates a matching
`facility::ResourceBooking` spanning the event window with metadata pointing
back at the event_facility row. The two rows travel together: detaching the
facility soft-deletes the pivot + auto-cancels the booking; retiring the
facility cascades detachment.

### 1.3 Multi-facility is Enterprise-only

Small + Medium tenants attach exactly 0 or 1 facility per event. A 0-facility
event is valid (virtual awards ceremonies, outdoor camp openings held on
undesignated land). A 1-facility event is the standard case. 2+ facilities
requires the `event_multi_facility` entitlement (Enterprise) — for large
tournaments across multiple courts.

## 2. The row-level attribution contract

Per `.kiro/steering/tenancy-columns.md` §3 + §5:

- ✅ `events.tenant_id` — required, FK, cascade
- ✅ `events.organization_id` — required, FK, restrict
- ✅ `events.branch_id` — optional, FK, restrict
- ✅ `events.season_id` — optional, FK, restrict
- ❌ `events.application_id` — FORBIDDEN (Application cascades through tenants)
- ❌ `events.region_id` — FORBIDDEN (cascade through branch)
- ❌ `events.scope_node_id` — FORBIDDEN (Events are not scope consumers)
- ✅ `event_facilities.tenant_id` — required, FK, cascade
- ✅ `event_facilities.event_id` — required, FK, cascade
- ✅ `event_facilities.facility_id` — required, FK, restrict
- ❌ `event_facilities.branch_id` — FORBIDDEN (cascade through facility)

Cross-tenant FKs from Event to any aggregate are forbidden. Cross-organization
FKs (branch outside event.organization_id, facility outside
event.organization_id) are refused by the observer.

## 3. Tier boundaries

Per `hierarchy.md` §7 and this module's entitlements:

| Tier       | Events/year | Public visibility | Livestream | Prize pool | Multi-facility | Sponsors |
| ---------- | ----------- | ----------------- | ---------- | ---------- | -------------- | -------- |
| Small      | 12          | ❌                | ❌         | ❌         | ❌             | ❌       |
| Medium     | 60          | ✅                | ✅         | ❌         | ❌             | ❌       |
| Enterprise | unlimited   | ✅                | ✅         | ✅         | ✅             | ✅       |

Backed by seven entitlements — see `entitlements.json`.

## 4. Lifecycle state machine

```
[draft]                       default on create
    ↓ (admin announce)
[announced]
    ↓ (registration_opens_at reached OR admin open)
[registration_open]
    ↓ (registration_closes_at reached OR admin close)
[registration_closed]
    ↓ (starts_at reached OR admin start)
[in_progress]
    ↓ (ends_at + 1h grace reached OR admin complete)
[completed]
    ↓ (admin archive)
[archived]
    ↓ (retention expires; PurgeArchivedEventsJob runs)
[hard-deleted]  audit outlives row 7 years

At any pre-completed state, admin can cancel:
    ↓ (admin cancel)
[cancelled]
    ↓ (admin archive)
[archived]

From archive within retention window:
[archived] → [completed] or [cancelled] (whichever it was)
```

### Post-registration-open guardrails

Every mutation post-`registration_open` triggers an audit event AND requires a
specific permission beyond the base `events.update`:

| Field(s)                                          | Permission required         | Fires event                                     | Audit severity                     |
| ------------------------------------------------- | --------------------------- | ----------------------------------------------- | ---------------------------------- |
| `starts_at` / `ends_at`                           | `events.dates.shift`        | `EventRescheduled`                              | warn                               |
| `branch_id` / primary facility                    | `events.venue.change`       | `EventVenueChanged`                             | warn                               |
| `entry_fee_cents` / late fee / prize pool         | `events.pricing.change`     | `EventPricingChanged`                           | critical (post-registration_open)  |
| `min_age` / `max_age` / `age_group_ids` narrowing | `events.eligibility.narrow` | `EventMinorEligibilityCorrected`                | critical when excludes registrants |
| Any status transition to `cancelled`              | `events.cancel`             | `EventCancelled` + `EventCancellationBroadcast` | warn                               |

Each of these fires a cannot-opt-out notification to affected registered
participants (and guardians of minor participants where applicable).

## 5. The livestream contract

`livestream_url` + `livestream_password` are gated by the `event_livestream`
entitlement (Medium+). The password is confidential per `data-classes.json` —
never rendered in-app, delivered exclusively via secure email to registered
participants + guardians on `EventLivestreamActivated`.

## 6. What this module does NOT do

- **Doesn't own registration.** Wave 3 athlete-enrollment module owns the
  `event_registrations` table + the registrant PII. This module publishes the
  events + eligibility rules; enrollment enforces them.
- **Doesn't own bookings.** Facility module owns `resource_bookings`. Event
  composes them through the `event_facilities` pivot; the reconciler keeps them
  synchronized.
- **Doesn't invoice.** Wave 4 finance module reads `entry_fee_cents` +
  `late_registration_fee_cents` + `prize_pool_cents` and generates invoices per
  registration.
- **Doesn't manage brackets.** Bracket / seeding logic (single_elim,
  double_elim, round_robin, group_stage) is Wave 4+ — this module ships `format`
  as a metadata field.
- **Doesn't broadcast video.** `livestream_url` is a stored URL to whatever
  external service (YouTube, Twitch, private CDN) the tenant uses. No
  transcoding, no CDN.
- **Doesn't manage sponsors.** `sponsors` JSONB is metadata; a real sponsor CRM
  would be a future module.
- **Doesn't nest.** Events are flat. A tournament with prelims + finals is two
  separate Events.

## 7. Cross-references

- `.kiro/steering/hierarchy.md` §1a — Event vocabulary
- `.kiro/steering/hierarchy.md` §7 — tier matrix (event_slot per tier)
- `.kiro/steering/tenancy-columns.md` §3, §5 — column contract
- `modules/sports/blueprints/season/` — parent Season module
- `modules/platform/blueprints/organization/` — required parent org
- `modules/platform/blueprints/branch/` — optional parent branch
- `modules/platform/blueprints/facility/` — the ResourceBooking primitive
- `modules/platform/blueprints/teams/schemas/event-team.schema.json` — the
  sibling EventTeam pivot
