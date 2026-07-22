# safeguarding — changelog

## [Unreleased] — inception (Wave 3)

- Two owned entities: BackgroundCheck / PolicyAcknowledgement.
- Assignment gate blocks Coach → Team assignment when check missing/expired OR
  policy version not acknowledged.
- 6 published events: `CheckVerified`, `CheckExpiring`, `CheckExpired`,
  `AssignmentBlocked`, `PolicyAcknowledged`, `PolicyReleased`.
- Bridges to `compliance/compliance::SafeguardingIncident` for the report side.
- Retention: BackgroundCheck 10y post-expiry; PolicyAcknowledgement retained
  indefinitely (mandatory audit).

### Dependencies

- `foundation`, `tenancy`, `application`, `user`, `staff`, `coaching`,
  `compliance`, `storage`, `notifications`.

### ULID prefixes

- `bgc_`, `pak_` — registered.
