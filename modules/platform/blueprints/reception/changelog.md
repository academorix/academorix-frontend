# reception — changelog

## [Unreleased] — inception (Wave 2)

- One entity: ReceptionVisit (walk-in tracker).
- Composes approvals + day-passes + wristbands + walk-in registration flow.
- Auto-checkout stale visitors after expected_end_at.
- 5 events including `VisitorCheckedIn`, `WristbandIssued`, `DayPassSold`.

### Dependencies

- `foundation`, `tenancy`, `application`, `user`, `branch`, `facility`,
  `approvals`, `athlete`, `membership`, `credentials`, `invoice`, `payment`,
  `notifications`.

### ULID prefixes

- `rvs_` — registered.
