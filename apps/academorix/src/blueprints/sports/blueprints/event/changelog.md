# event — changelog

## [Unreleased] — inception (Wave 3b)

- Event module authored. Two owned entities:
  - `Event` (`eve_` prefix) — sport competitive / social / educational event.
  - `EventFacility` (`efc_` prefix) — pivot attaching Facility to Event.
- Eight lifecycle statuses: draft → announced → registration_open →
  registration_closed → in_progress → completed → cancelled → archived.
  Automatic transitions via `RollEventStatusJob` (hourly cron).
- Every Event carries `tenant_id` + required `organization_id` + nullable
  `branch_id` + nullable `season_id`. NEVER `application_id`, `region_id`,
  `scope_node_id`.
- Seven entitlement gates:
  - `sports_events` (module master; all tiers)
  - `event_slot` (Small=12/year, Medium=60/year, Enterprise=null)
  - `event_public_visibility` (Medium+)
  - `event_livestream` (Medium+)
  - `event_prize_pool` (Enterprise-only)
  - `event_multi_facility` (Enterprise-only)
  - `event_sponsors` (Enterprise-only)
- Facility composition via `event_facilities` pivot with `is_primary` invariant
  enforced by partial unique index (at most one primary per event).
  Multi-facility Enterprise-only.
- Post-registration-open guardrails: dates.shift, venue.change, pricing.change,
  eligibility.narrow — each owner-only + fires audit-critical events +
  cannot-opt-out notifications to registrants.
- `EventCancellationBroadcast` fan-out to every registered participant +
  guardian for minors on `EventCancelled`.
- Livestream password is confidential — never rendered in-app, delivered via
  secure email on `EventLivestreamActivated`.
- Downstream: Session.event_id (Wave 3b, nullable), teams::EventTeam.event_id
  (Wave 2b nullable → Wave 3 required), athlete-enrollment (Wave 3+).

### Compatibility

- Depends on `foundation`, `tenancy`, `application`, `organization`, `region`,
  `branch`, `entitlements`, `teams`, `season`, `age-group`, `facility`.
- Extended by NONE. Wave 3+ session / athlete-enrollment / finance reference
  Event via FK — that's `planned_consumers`, not `extendedBy`.

### Design notes

- Event does NOT carry `application_id` / `region_id` / `scope_node_id` (row not
  in `tenancy-columns.md` §2's 8 rows carrying application_id).
- `organization_id` immutable post-create; `branch_id` immutable
  post-registration_open (venue change requires special permission).
- `primary_sport_key` immutable post-registration_open (drift signal).
- `starts_at`/`ends_at` on completed events refused outright
  (`EVENT_DATES_LOCKED_AFTER_COMPLETION`).
- `EventPricingChanged` post-registration_open is audit-severity='critical' —
  7-year retention; refund liability trail.
- `EventMinorEligibilityCorrected` is audit-severity='critical' when excludes
  existing minor registrants — regulator-facing signal.

### ULID prefix registration

- `eve_` (Event) — new. Register in
  `modules/shared/blueprints/foundation/data/ulid-prefixes.json` in the same
  commit as the schema landing.
- `efc_` (EventFacility) — new. Same registration path.
