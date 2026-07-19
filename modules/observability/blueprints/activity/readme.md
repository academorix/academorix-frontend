# activity

The activity lane. Wraps vendor `spatie/laravel-activitylog` for
tenant-user-facing "What happened recently?" feeds. Human-readable log lines
that answer "what did I / my team / this branch do this week?".

## 1. What this module owns

| Concern                                        | Owned artefact                                                                                                                                                                                                                                    |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vendor-adapted activity_log table              | `Activity` model wrapping `spatie/laravel-activitylog`'s `activity_log` table + added `tenant_id NOT NULL` + `application_id NULLABLE` + composite indexes + `BelongsToTenant` global scope                                                       |
| Retention policy per tenant                    | `ActivityRetentionPolicy` — per-tenant, per-log_name override on top of the config default. Enterprise entitlement gates extending past 90d                                                                                                       |
| The opt-in trait                               | `LogsActivity` — composed on domain models when their mutations should surface on the tenant feed                                                                                                                                                 |
| Description formatting                         | `ActivityFormatter` — renders human-readable description strings from event + properties. Descriptions are AUTHORED by developers as template strings; the formatter interpolates properties in                                                  |
| Real-time broadcast to tenant feeds            | `ActivityBroadcastPublisher` — pushes new activity rows to `tenant.{tenantId}.activity` + `user.{userId}.activity` reverb channels. Opt-in via `activity_broadcast` entitlement                                                                   |
| Per-request batch aggregator                   | `ActivityBatcher` — groups all activities from one HTTP request under a shared `batch_uuid` so the feed can render 'Alice made 3 changes to Court 3 booking' as one item instead of three                                                         |
| Retention pipeline                             | Nightly `PurgeExpiredActivitiesJob` respecting per-tenant policies; weekly `ArchiveActivitiesToColdStorageJob` sending >90d rows to S3; nightly `ReconcileActivityBatchesJob` closing orphan batches from crashed requests                        |
| Backfill                                       | One-shot `BackfillActivityTenantIdFromJsonbJob` reads `tenant_id` out of the vendor's `properties` JSONB blob and populates the new dedicated column (existing installs shipped `tenant_id` inside the blob — the new column is the primary path) |
| DPO / GDPR surface                             | Right-of-access via `/api/v1/activities/mine`; right-to-erasure cascades activity rows for a subject on `user::IdentityErased`                                                                                                                    |
| Digest emails                                  | `ActivityDigestEmailNotification` — opt-in per user (daily / weekly summary of activity on entities they follow). Gated by `activity_digest_email` entitlement (Medium+)                                                                          |

## 2. Placement rationale

Sits at priority **16** — after `foundation` (0), `tenancy` (2), `application`
(4), `user` (6), `entitlements` (12), and `compliance` (14). Boots before every
domain module (`sports`, `billing`, `access`, ...) so those modules can safely
compose `LogsActivity` on their models at boot time.

Boots AFTER `compliance` (priority 14) because `compliance::retention-runs`
audits activity retention — the compliance module needs to see this module's
config to build its retention report.

Same-plane sibling of `audit` (Wave 6, priority 15) — audit and activity share
the vendor-adaptation shape but never share event routing. **A mutation fires
audit OR activity, never both** (per `hierarchy.md` §11):

- **audit** — compliance-grade, regulator-facing, every field diff, 7-year
  retention, `HasAudit` trait, immutable, no opt-out
- **activity** — user-facing feed, deliberate event capture, human-readable
  descriptions, 90-day-to-1-year retention, `LogsActivity` trait, opt-in per
  model

## 3. Vendor adaptation contract

`spatie/laravel-activitylog` ships the vendor `activity_log` table with:

```
id, log_name, description, subject_type, subject_id, causer_type, causer_id,
event, properties, batch_uuid, created_at, updated_at
```

We adapt it in-place via a `Schema::table` migration that adds:

- `tenant_id UUID NOT NULL` — auto-filled by `BelongsToTenant`. NOT NULL for
  tenant-audience rows; NULL for platform-audience rows written by
  `PlatformUser` mutations (audit stream)
- `application_id UUID NULLABLE` — auto-filled from request context
  (`X-Application-Id` header)
- Composite indexes on `(tenant_id, created_at DESC)` — the primary user feed
  read path; `(tenant_id, log_name, created_at DESC)` — filter by feed name;
  `(subject_type, subject_id, created_at DESC)` — per-entity activity;
  `(causer_type, causer_id, created_at DESC)` — per-actor "my activity";
  `(batch_uuid)` partial — group requests; `(application_id, tenant_id,
created_at DESC)` — cross-app rollup

The `Activity` model implements the vendor's `Activity` contract and composes:

- `Auditable` — no, activity IS the audit surface for tenant users
- `BelongsToTenant` — auto-scopes reads + fills `tenant_id` on save
- `HasFactory` + `HasMockableStorage` — for fixtures + tests

The vendor bigint auto-increment `id` stays — the `act_` ULID prefix is
**reserved** for a future ULID conversion (deferred to Wave 7+; noted in the
schema).

## 4. Two aggregates

| Model                     | Storage                                | Purpose                                                                                                                                                                                                                       |
| ------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Activity`                | `activity_log` (vendor-adapted)        | One row per user-facing activity event. Polymorphic subject (the thing something happened to) + polymorphic causer (the actor). Immutable in production — the vendor allows updates only for transitional status refinements. |
| `ActivityRetentionPolicy` | `activity_retention_policies` (native) | Per-tenant, per-log_name override on top of the config default. `retention_days` between 30 and 730. Enterprise entitlement gates the write path.                                                                             |

## 5. The two known steering gaps this module closes

Per `.kiro/steering/tenancy-columns.md` §3 §9:

1. **Add `tenant_id` to `activity_log`.** The vendor extracts tenant id from the
   `properties` JSONB blob which prevents indexing. This module ships the
   `Schema::table` migration adding `tenant_id UUID NOT NULL` + a composite
   index with `created_at`, plus the `BackfillActivityTenantIdFromJsonbJob`
   that reads `properties.tenant_id` on existing rows.
2. **Add `application_id` to `activity_log`.** Rows written under a tenant
   audience carry the active `X-Application-Id`; rows written from platform
   contexts (a `PlatformUser` mutation) leave it NULL. Enables per-application
   feed splits when multi-app tenants adopt.

These two gaps are the "High priority — no blocker" entries in the tenancy-
columns living gap register.

## 6. Lifecycle

```
                                       LogsActivity trait on a domain model
                                       observes ATTR_ mutations that match
                                       $logAttributes / $logOnlyDirty
                                                    │
                                                    ▼
      ActivityBatcher.beginBatch(request_id) ─► ActivityBatchStarted
                                                    │
                                                    ▼
                                       trait dispatches
                                       $activity->log('created')
                                                    │
                                                    ▼
                                       vendor's ActivityLogger persists row
                                                    │
                                                    ▼
                       ActivityObserver@creating adds tenant_id + application_id
                                                    │
                                                    ▼
                        ActivityObserver@created ─► ActivityRecorded
                                                    │
                        ┌───────────────────────────┴─────────────────────────────┐
                        ▼                                                         ▼
       ActivityBroadcastPublisher                                     digest queue
       pushes to tenant.{id}.activity                                 (opt-in per user)
       + user.{id}.activity if entitled
                                                    │
                                                    ▼
              request terminates → ActivityBatcher.completeBatch ─► ActivityBatchCompleted

           ── retention pipeline ──
           daily PurgeExpiredActivitiesJob → ActivityPurgeExecuted
           weekly ArchiveActivitiesToColdStorageJob → moves >90d rows to S3
           nightly ReconcileActivityBatchesJob → closes orphan batches
```

## 7. Public surface

### Tenant host (authenticated tenant users)

- **Reads only for `Activity`.** Writes happen exclusively via the vendor
  `LogsActivity` trait composed on domain models — not via HTTP.
- **CRUD for `ActivityRetentionPolicy`.** Enterprise-gated by the
  `activity_extended_retention` entitlement.
- Enumeration endpoints answer:
  - `GET /activities` — tenant-wide feed, filtered to entities the caller can
    access (RBAC-scoped via `activity.enforce_scope` middleware)
  - `GET /activities/mine` — the caller's own activity (as causer)
  - `GET /activities/by-entity/{subject_type}/{subject_id}` — the activity
    stream for one entity ("what happened on this booking last week")
  - `GET /activities/by-user/{user}` — one actor's activity (admins for
    audit-adjacent visibility; users see only themselves)
  - `GET /activities/feed` — WebSocket subscription info (returns the channel
    names the caller should subscribe to)
  - `GET /activities/export` — asynchronous CSV export (Medium+
    `activity_export` entitlement)

### Platform-admin host

Read-only cross-tenant support-tool endpoints for Academorix ops. No writes,
no policy CRUD.

## 8. Consumer contract — how domain modules opt in

A downstream module wanting user-facing activity capture on its aggregate:

```php
use Academorix\Observability\Activity\Concerns\LogsActivity;
use Spatie\Activitylog\LogOptions;

final class Booking extends Model
{
    use BelongsToTenant;
    use LogsActivity;

    protected function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['facility_id', 'starts_at', 'ends_at', 'status'])
            ->logOnlyDirty()
            ->useLogName('bookings')
            ->setDescriptionForEvent(fn (string $event) => match ($event) {
                'created' => sprintf(
                    '%s booked %s for %s',
                    $this->causer->display_name ?? 'Someone',
                    $this->facility->name,
                    $this->starts_at->format('D M j'),
                ),
                'updated' => sprintf('%s updated their booking on %s', $this->causer->display_name ?? 'Someone', $this->facility->name),
                'deleted' => sprintf('%s cancelled their booking on %s', $this->causer->display_name ?? 'Someone', $this->facility->name),
                default => 'Booking changed',
            });
    }
}
```

Rules for authors:

- **Choose `logOnly()` deliberately.** Every field logged appears in
  `properties` — sensitive fields should NOT be logged. Prefer named fields
  over `logAll()`.
- **Descriptions are user-facing.** Write in second-person or third-person
  narrative ("Alice booked Court 3 for tomorrow"). Never emit stack traces or
  raw payloads.
- **Pick a `log_name`.** Registered names live in `data/log-names-catalog.json`
  — coordinate additions with this module.
- **NEVER `LogsActivity` on PII-heavy aggregates.** Use `audit` for those; the
  regulator-facing audit stream retains longer, encrypts fields, and is not
  broadcast to tenant users.

## 9. What this module does NOT do

- **No compliance-grade record.** That's `audit`'s job. Activity is UX feed
  only. Fields aren't encrypted at rest; retention is short; erasure cascades
  hard-delete rows (unlike audit which anonymises deny records).
- **No writes over HTTP.** Activities are captured exclusively via the vendor
  `LogsActivity` trait on domain models. Writing directly is a bug.
- **No user-configured description templates.** Descriptions are authored by
  developers in the model's `getActivitylogOptions()`. Tenant-configurable
  templating is deferred.
- **No cross-tenant activity aggregation.** Every read is tenant-scoped via
  `BelongsToTenant`.
- **No behavioural analytics.** That's `growth::analytics` — analytics captures
  fine-grained interaction events (view, click, scroll); activity captures
  deliberate user-visible mutation milestones.
- **No `region_id` / `organization_id` / `scope_node_id`.** Application cascades
  through `tenant_id`; activity is not a scope consumer.
- **No ULID conversion in Wave 6.** The `act_` prefix is reserved for a future
  wave; the vendor bigint id stays.

## 10. Terminology

- **Activity** — one row on the `activity_log` table.
- **Log name** — a string bucket ("default", "bookings", "auth", "branch-
  management"). Consumers pick one per model.
- **Subject** — the polymorphic target of the activity (what happened TO). A
  Booking, an Athlete, a Team.
- **Causer** — the polymorphic actor (who did it). Usually a User;
  occasionally a `System` sentinel; rarely a `PlatformUser` for support ops.
- **Batch** — group of activities from one HTTP request, keyed by
  `batch_uuid`. Enables collapsed feed rendering ("Alice made 3 changes").
- **Retention policy** — per-tenant, per-log_name override on `retention_days`.
  Default 90; up to 365 with entitlement; up to 730 for regulator holds.

## 11. Cross-references

- Design source: `.kiro/steering/growth-and-observability.md` §1 Lane 3.
- Design source: `.kiro/steering/hierarchy.md` §11 two-signal split.
- Steering: `.kiro/steering/tenancy-columns.md` §3 activity gap, §9 living gap
  register.
- Sibling: `modules/observability/blueprints/audit/` — regulator-facing signal
  authored in parallel.
- Sibling: `modules/observability/blueprints/monitoring/` — system-health lane,
  future wave.
- Vendor:
  [spatie/laravel-activitylog](https://spatie.be/docs/laravel-activitylog/v4)
  v4+ — the underlying library we adapt.

## 12. Blueprint layout (this folder)

```
modules/observability/blueprints/activity/
├── module.json / readme.md / changelog.md
├── schemas/
│   ├── activity.schema.json
│   └── activity-retention-policy.schema.json
├── relations.json, traits.json, attributes.json, routes.json, middleware.json
├── events.json, listeners.json, observers.json, hooks.json
├── jobs.json, schedule.json, commands.json
├── notifications.json, broadcasts.json
├── policies.json, permissions.json, features.json, entitlements.json
├── health.json, metrics.json, analytics.json, caches.json, retention.json
├── compliance.json, data-classes.json, errors.json, rules.json
├── feature-flags.json
├── config.json, settings.json
├── data/
│   ├── log-names-catalog.json
│   └── description-template-samples.json
└── sdui/
    ├── resources/activity/{list,show}.screen.json
    ├── resources/activity-retention-policy/{list,create,show}.screen.json
    ├── screens/{by-entity,by-user,feed-viewer}.screen.json
    └── widgets/activity-timeline.widget.json
```
