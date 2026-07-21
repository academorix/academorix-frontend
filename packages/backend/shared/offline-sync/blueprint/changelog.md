# offline-sync — changelog

## [Unreleased] — inception (Wave 4)

- One entity: SyncCursor.
- Attribute-driven syncable entity discovery via `#[AsSyncableEntity]`.
- Two conflict strategies: last_write_wins (scalar), merge (attendance).
- Idempotent push via device-side idempotency keys.
- 4 events: SyncPulled, SyncPushed, SyncConflictDetected, SyncConflictResolved.

### Dependencies

- `foundation`, `tenancy`, `application`, `user`, `auth`, `attendance`,
  `session`, `notifications`.

### ULID prefixes

- `syc_` — registered.
