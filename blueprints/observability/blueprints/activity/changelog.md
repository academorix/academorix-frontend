# activity — module changelog

Auditor-friendly per-artefact changelog. Every material blueprint change lands
here with a date + a summary; downstream reviewers (compliance, security,
platform ops) scan this file to know what changed since the last audit.

## 2026-07-15 — Module inception

- **add** — folder `modules/observability/blueprints/activity/` with the full
  blueprint artefact set (module.json, readme.md, schemas, relations, traits,
  attributes, routes, middleware, events, listeners, observers, hooks, jobs,
  schedule, commands, notifications, broadcasts, policies, permissions,
  features, entitlements, health, metrics, analytics, caches, retention,
  compliance, data-classes, errors, rules, feature-flags, config, settings, data
  fixtures, sdui).
- **two entities** — `Activity` (the vendor-adapted `activity_log` table with
  `tenant_id NOT NULL` + `application_id NULLABLE` columns added by
  `Schema::table` migration on top of `spatie/laravel-activitylog`'s vendor
  migration) and `ActivityRetentionPolicy` (per-tenant, per-log_name retention
  override).
- **vendor adaptation** — the migration adds four new columns (`tenant_id`,
  `application_id`) plus six composite indexes. Backfill job
  `BackfillActivityTenantIdFromJsonbJob` reads `tenant_id` from the vendor's
  `properties` JSONB blob for existing rows. Closes the two "High priority" gaps
  in `.kiro/steering/tenancy-columns.md §9`.
- **ULID prefix reserved** — `act_` registered against future ULID conversion
  (deferred to Wave 7+). Vendor bigint id stays for Wave 6.
- **opt-in trait** — `LogsActivity` composed on domain models where user-facing
  activity capture is wanted. NOT everywhere — audit captures everything;
  activity captures deliberate user-visible events like "Alice booked Court 3
  for tomorrow". Consumer contract documented in `readme.md §8`.
- **two-lane contract lock** — a mutation fires audit OR activity, never both.
  Same steering entry (`hierarchy.md §11`) that governs `audit`'s scope governs
  activity's.
- **event contract** — 7 events. `ActivityRecorded` (afterCommit) fires on every
  vendor row insert and drives downstream broadcast + digest-notification queue.
  `ActivityBatchStarted / Completed` bracket a request.
  `ActivityRetentionPolicyCreated / Updated` are admin CRUD signals.
  `ActivityPurgeExecuted` is retention plumbing. `ActivityFeedSubscribed`
  captures reads for feed-analytics (functional consent tier).
- **broadcast surface** — two channels: `tenant.{tenantId}.activity` (for admin
  dashboards + shared feeds) and `user.{userId}.activity` (for the caller's own
  "My activity" panel). Gated by `activity_broadcast` (Small+).
- **retention** — 90-day default (all tiers); extendable to 365 days with the
  `activity_extended_retention` entitlement (Enterprise); up to 730 days for
  regulator-holds. `PurgeExpiredActivitiesJob` runs nightly respecting per-
  tenant policy overrides. `ArchiveActivitiesToColdStorageJob` runs weekly for
  rows past the hot window.
- **compliance** — GDPR Art. 15 (right of access) + Art. 17 (right to erasure)
  cascade; CCPA §1798.100 right-to-know is satisfied by the user-facing feed.
  Full evidence set in `compliance.json`.
- **entitlements** — 5 keys. `activity_capture` (all tiers) — master gate.
  `activity_retention_extended` (Enterprise). `activity_broadcast` (Small+).
  `activity_digest_email` (Medium+). `activity_export` (Medium+).

### Compatibility

- Depends on `foundation`, `tenancy`, `application`, `user`, `entitlements`,
  `compliance`.
- Depends on vendor `spatie/laravel-activitylog ^4.0`.
- Inception release.
