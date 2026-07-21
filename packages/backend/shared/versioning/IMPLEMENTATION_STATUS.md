# shared/versioning — Phase 3 implementation status

## Status: SCAFFOLDED — version-matrix model landed; Actions + middleware pending

## What landed

- **`ApiVersion`** — supported API version record (version string
  - status: `active` / `deprecated` / `sunset` + sunset_at).
- **`VersionUsage`** — audit trail: per-request version-header logging for the
  deprecation-usage dashboard.
- Enum types (`ApiVersionStatus`).
- Attribute-first migrations.
- Config file (default active version + supported set).
- Blueprint-emitted Action stubs (every one returns `null`).

## What's pending

### Middleware

- **`RouteVersionMiddleware`** — reads the
  `Accept: application/vnd.stackra.v<n>+json` header (OR `?api_version=<n>`
  query param); routes the request to the correct v<n> controller. Currently a
  scaffold — the actual route rewiring needs the routing package's
  `RouteRegistrar` to become version-aware.
- **`DeprecationHeaderMiddleware`** — appends `Deprecation: true`
  - `Sunset: <date>` headers on responses served from deprecated versions.

### Actions to complete

- **`ListVersionAction`** — GET `/api-versions`. Returns the version matrix
  (which versions are active / deprecated / sunset + their `sunset_at`).
- **`ShowVersionAction`** — GET `/api-versions/{version}`. Detailed version
  record + changelog reference.
- **`ReportUsageAction`** — GET `/platform/api-versions/usage`. Platform admin
  sees which tenants are still on deprecated versions. Blocker for a deprecation
  sunset.

### Services

- **`VersionResolver`** — request → version-matcher. Fallback order: `Accept`
  header → `?api_version` query → default.
- **`VersionUsageLogger`** — writes `VersionUsage` rows on every request (async,
  buffered to avoid hot-path overhead).
- **`VersionCompatibilityChecker`** — validates that the target version can
  serve the requested endpoint (some endpoints exist only in v2+).

### Jobs

- **`PruneVersionUsageJob`** — cron: weekly. Retains 90 days of usage for the
  deprecation dashboard.

### Cross-module dependencies

- **`framework/routing`** — the `RouteRegistrar` needs version-awareness.
  Currently the assumption is that v1 is hardcoded in every controller's
  `#[Prefix('/api/v1')]` — future v2 will need a `#[Version(2)]` attribute that
  registrar honours.

## Backlog priorities

Versioning is a Phase-4/5 concern — the API is currently on v1 only and no
deprecation is scheduled. Most tasks stay P2/P3 until v2 lands.

1. **P2 — `ListVersionAction`** — for the FE compatibility check + docs surface.
2. **P2 — `RouteVersionMiddleware` + routing integration** — prerequisite for v2
   launch.
3. **P3 — usage tracking + deprecation dashboard** — needed only when a version
   is deprecated.

**Note:** this module is deliberately scaffolded ahead of demand. Its Phase-3
concern is standards + tests, not feature completion. The heavy implementation
lands when v2 is on the roadmap.
