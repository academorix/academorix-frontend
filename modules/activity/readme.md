# activity

Workspace-facing activity feed. Wave 2 infrastructure. Wraps `spatie/laravel-activitylog` with our conventions.

## 1. What this module owns

| Concern | Owned artefact |
| --- | --- |
| `HasActivityLog` trait (opt-in) | wraps spatie's `LogsActivity` + adds workspace scoping + ULID prefix + causer resolution |
| `Activity` model extending spatie's | adds `BelongsToWorkspace`, `HasUlids`, prefix `act_`, tier retention casts |
| `#[LoggableActivity]` attribute | build-time discovery of opting-in models |
| Workspace HTTP surface | `GET /api/v1/activities` filterable via spatie query builder |
| Retention prune (tiered) | 30 / 90 / 365 days per plan via `PruneActivityLogJob` |

## 2. Activity vs Audit

Two adjacent but **distinct** modules:

| Dimension | `activity` | `audit` |
| --- | --- | --- |
| Audience | Workspace admins + end users | Compliance / DPO / auditors |
| Package | `spatie/laravel-activitylog` | `owen-it/laravel-auditing` |
| Retention | 30 / 90 / 365 days by plan | 365 days hot + 7y cold (fixed) |
| Encryption | none | KMS-encrypted for restricted-tier field values |
| HTTP surface | `/api/v1/activities` (workspace + user) | `/api/v1/platform/audits` (platform admin only) |
| Volume | high — every user action | low — only compliance-material changes |
| Purpose | "who did what today?" product feed | "prove this change occurred + who caused it" evidence trail |

They fire on different signals — a normal edit produces one `activity_log` row; a change to a permission / role / consent record produces both an activity row (workspace sees it) AND an audit row (regulator sees it).

## 3. Opting a model in

```php
use Academorix\Activity\Concerns\HasActivityLog;
use Academorix\Activity\Attributes\LoggableActivity;
use Spatie\Activitylog\LogOptions;

#[LoggableActivity(logName: 'invitations', retention: 'tier_based')]
class Invitation extends Model
{
    use HasActivityLog;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['email', 'state', 'role_slug'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
```

`HasActivityLog` sets sensible defaults so most models declare zero configuration.

## 4. Retention tiers

Plan-driven via `entitlements.json`:

| Plan | `activity.retention_days` |
| --- | --- |
| Free | 30 |
| Team | 90 |
| Enterprise | 365 |

`PruneActivityLogJob` scans `WHERE created_at < now() - retention_days` daily. Rows past retention are hard-deleted (activity is not evidence; long-term proof lives in `audit`).

## 5. Files

Standard blueprint. No entity schema — `Activity` inherits spatie's `activity_log` table.

## 6. What this module does NOT do

- **No compliance trail.** That's `audit` module.
- **No custom fields on activity rows.** Extra data goes into spatie's `properties` JSONB column via `HasActivityLog::activity()`.
- **No inbound webhook surface.** Activity is write-only from within the app.
