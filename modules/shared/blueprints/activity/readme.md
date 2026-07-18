# academorix/activity

Tenant-facing activity feed for Academorix. Owns the `Activity` aggregate — a
thin wrapper around
[spatie/laravel-activitylog](https://spatie.be/docs/laravel-activitylog/v4/introduction)
with our conventions: tenant scoping, ULID prefix, tier-based retention, and
causer resolution from Sanctum.

## Aggregate

| Aggregate  | ULID prefix | Table          | Purpose                                                                         |
| ---------- | ----------- | -------------- | ------------------------------------------------------------------------------- |
| `Activity` | `act_`      | `activity_log` | Extends spatie's Activity model — adds `tenant_id` + `BelongsToTenant` + ULIDs. |

## Install

```bash
composer require academorix/activity
```

## Opting a model into the feed

Compose `HasActivityLog` and (optionally) decorate with `#[LoggableActivity]` so
the `activity:describe` inventory picks it up:

```php
use Academorix\Activity\Attributes\LoggableActivity;
use Academorix\Activity\Concerns\HasActivityLog;

#[LoggableActivity]
final class Branch extends Model
{
    use HasActivityLog;
}
```

That's it. Every `saving` / `deleting` / `restoring` on the model writes an
`activity_log` row with the current tenant + causer auto-filled.

## Contributes

- **Trait**: `HasActivityLog` (aliases spatie's `LogsActivity` + adds our
  defaults — log name from the model's short class name, defaults to
  `logAll()->logOnlyDirty()->dontSubmitEmptyLogs()`).
- **Attribute**: `#[LoggableActivity]` — compile-time inventory marker.
- **Permissions**: `ActivityPermission` (dual-guard — tenant view + platform
  cross-tenant view).
- **Commands**: `activity:prune`, `activity:seed`, `activity:describe`.
- **Events**: `ActivityRecorded` (fires after every `Activity` row is
  persisted).
- **Bindings**: `ActivityLoggerInterface` (default: `DefaultActivityLogger`),
  `ActivityRegistryInterface` (default: `ActivityRegistry`).

## Retention

Rows are hard-deleted past their tier window — activity is product UX, not
compliance evidence.

| Tier    | Window   |
| ------- | -------- |
| starter | 30 days  |
| growth  | 90 days  |
| pro     | 365 days |

`activity:prune` reads the tier from the tenant's active subscription and
dispatches `PruneActivityLogJob` per tenant.

## Distinct from `audit`

| Concern      | `activity`                   | `audit`                                |
| ------------ | ---------------------------- | -------------------------------------- |
| Purpose      | Product feed (who did what)  | Compliance evidence                    |
| Volume       | Medium                       | High                                   |
| Retention    | Tier: 30 / 90 / 365 days     | 7y hot + cold                          |
| Wraps        | `spatie/laravel-activitylog` | `owen-it/laravel-auditing`             |
| Row shape    | Human-readable description   | Structured column-diff                 |
| Immutability | Append-only                  | Append-only + tamper-evident (planned) |

## Tests

```bash
composer install
vendor/bin/pest
```
