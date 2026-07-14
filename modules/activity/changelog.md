# activity — changelog

## [Unreleased] — inception

- Activity feed module authored. Wraps `spatie/laravel-activitylog`.
- Publishes `HasActivityLog` trait + `#[LoggableActivity]` attribute.
- Workspace-facing `GET /api/v1/activities` filterable via spatie query builder.
- Tier-based retention (30 / 90 / 365 days per plan) via `PruneActivityLogJob`.
- Platform-admin cross-workspace surface for support triage.
- Wraps spatie's `Activity` model with `BelongsToWorkspace` + ULID prefix `act_`.

### Compatibility

- Depends on `foundation`, `workspaces`.
- No breaking change surface — inception release.
