# activity — changelog

## [Unreleased] — inception

- Activity feed module authored. Wraps `spatie/laravel-activitylog`.
- Publishes `HasActivityLog` trait + `#[LoggableActivity]` attribute.
- Tenant-facing `GET /api/v1/activities` filterable via spatie query builder.
- Tier-based retention (30 / 90 / 365 days per plan) via `PruneActivityLogJob`.
- Platform-admin cross-tenant surface for support triage.
- Wraps spatie's `Activity` model with `BelongsToTenant` + ULID prefix `act_`.

### Compatibility

- Depends on `foundation`, `tenancy`.
- No breaking change surface — inception release.
