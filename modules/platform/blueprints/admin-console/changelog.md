# admin-console — changelog

## [Unreleased] — inception (Wave 2)

- One entity: AdminDashboardConfig.
- Two audiences: tenant admin (sanctum) + platform staff (platform_admin).
- Impersonation delegates to `access/delegation` — audit-material.
- Cross-module dashboard aggregating finance + reporting + activity.

### Dependencies

- `foundation`, `tenancy`, `application`, `user`, `platform-user`, `rbac`,
  `delegation`, `audit`, `activity`, `reporting`, `notifications`.

### ULID prefixes

- `adc_` — registered.
