# stackra/retention

Retention scanner for the Stackra monorepo — walks every Eloquent model
carrying `#[AsRetentionPolicy]`, computes the retention cutoff via the injected
`Clock`, and applies the declared action (`delete` / `archive` / `anonymize`) on
a scheduled cadence.

Framework-tier package: no domain knowledge, no per-app coupling. Sits alongside
`packages/compliance/architecture/` and consumes `stackra/foundation`,
`stackra/console`, `stackra/scheduling`, and
`stackra/service-provider`.

## Installation

Already wired into every app via the monorepo's path repositories
(`packages/compliance/*` is declared as a Composer path repo). Add the package
to a consuming app / module via:

```bash
composer require stackra/retention:'@dev'
```

Then declare a retention policy on any Eloquent model:

```php
use Stackra\Retention\Attributes\AsRetentionPolicy;
use Stackra\Retention\Enums\RetentionAction;

#[AsRetentionPolicy(
    key: 'ai.run',
    label: 'AI runs',
    description: 'Delete ai_runs older than 180 days.',
    retentionDays: 180,
    action: RetentionAction::Delete,
)]
final class AiRun extends Model
{
    // ...
}
```

The `RetentionPolicyBootstrapper` picks up the marker at boot on first
resolution of the `RetentionPolicyRegistry` — see
`packages/framework/service-provider/src/Bootstrappers/AbstractBootstrapper.php`
for the base contract.

## Usage

### Marker attribute

```php
use Stackra\Retention\Attributes\AsRetentionPolicy;
use Stackra\Retention\Enums\RetentionAction;

#[AsRetentionPolicy(
    key: 'notifications.digest',
    label: 'Weekly digest notifications',
    description: 'Delete stale digest rows after 90 days.',
    retentionDays: 90,
    action: RetentionAction::Delete,
    dateColumn: 'sent_at',        // override — default is `created_at`
    enabled: true,                 // feature-flag toggle
)]
final class DigestNotification extends Model
{
    // ...
}
```

### Discovery contract

Discovery lives in
`Stackra\Retention\Bootstrappers\RetentionPolicyBootstrapper`:

1. Walks every `#[AsRetentionPolicy]` via
   `Stackra\Foundation\Contracts\DiscoversAttributes` (the shared monorepo
   seam over `olvlvl/composer-attribute-collector`).
2. Skips entries where `enabled === false`.
3. Verifies each target is a subclass of `Illuminate\Database\Eloquent\Model`
   (WARNING + skip otherwise — the runner cannot query non-models).
4. Emits a `RetentionPolicyDescriptor` and registers it with the
   `RetentionPolicyRegistry`.
5. Duplicate keys throw `LogicException` at boot with BOTH colliding model
   class-strings for clear diagnostics.

### Runner contract

Runner lives in `Stackra\Retention\Runner\RetentionRunner`:

- `run(RetentionPolicyDescriptor $descriptor, bool $dryRun = false): RetentionRunReport`
- Computes cutoff via the injected `Stackra\Foundation\Contracts\Clock`
- Branches on `descriptor->action`:
  - `Delete` → `Model::query()->where($dateColumn, '<', $cutoff)->delete()` (or
    `->count()` on dry-run)
  - `Archive` → LEGITIMATE DEFERRAL — logs `TODO(retention-archive-storage)`
    warning and returns 0 rows. See the runner's docblock.
  - `Anonymize` → LEGITIMATE DEFERRAL — logs `TODO(retention-anonymize-pii)`
    warning and returns 0 rows.
- Wraps every branch in try/catch; never bubbles. One broken policy MUST NOT
  halt the batch.
- Times execution via `hrtime(true)` and echoes the duration on the report.

### Command usage

```bash
# Full sweep, real deletes
php artisan compliance:retention:run

# Preview only — replaces ->delete() with ->count() on every policy
php artisan compliance:retention:run --dry-run

# Restrict to a single policy by key
php artisan compliance:retention:run --key=ai.run

# Combined
php artisan compliance:retention:run --key=ai.run --dry-run
```

Scheduled cadence: `#[Cron('0 3 * * *')]` — daily at 03:00, gated by
`retention.schedule.enabled` (default `true`, env `RETENTION_SCHEDULE_ENABLED`).

## Configuration

Publish the config:

```bash
php artisan vendor:publish --tag=retention-config
```

Available keys:

| Key                          | Default       | Env                          | Purpose                                                                               |
| ---------------------------- | ------------- | ---------------------------- | ------------------------------------------------------------------------------------- |
| `retention.schedule.enabled` | `true`        | `RETENTION_SCHEDULE_ENABLED` | Master toggle for the scheduled runner.                                               |
| `retention.schedule.cron`    | `'0 3 * * *'` | `RETENTION_SCHEDULE_CRON`    | Reserved for future config-driven schedule overrides.                                 |
| `retention.batch_size`       | `1000`        | `RETENTION_BATCH_SIZE`       | Reserved for batched-delete iteration (v1 delete branch does not batch yet).          |
| `retention.dry_run_default`  | `false`       | `RETENTION_DRY_RUN`          | Force dry-run globally without a code change. Honoured by follow-up runner iteration. |

## Design notes

- **Stateless discovery** — the bootstrapper takes inputs explicitly; no
  reflection at runtime, no facades, no `env()`. Safe under Octane.
- **Runner is `#[Scoped]`** — the injected `Clock` + logger are per-request. One
  runner instance per request lifetime; the registry it reads from is
  `#[Singleton]`.
- **No SoftDeletes special-casing** — models using SoftDeletes see `->delete()`
  behaviour identical to a manual call: a soft delete on the model, not a hard
  delete. Force a hard delete by wrapping the model in a subclass that overrides
  `delete()` or by using a different retention approach (dedicated cold-storage
  action once v2 archive lands).
- **No cross-tenant considerations here** — the runner does not touch tenancy.
  Models that carry `BelongsToTenant` still enforce scope on their own queries;
  the retention query issues a plain `Model::query()` which respects every
  global scope the model ships.

## Anti-patterns

| Anti-pattern                                                   | Preferred                                                                                              |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Hand-maintained retention manifest in a package's provider     | `#[AsRetentionPolicy]` on the model class                                                              |
| Manual `Model::where(...)->delete()` in a cron job             | Register a policy and let the runner handle it                                                         |
| Duplicating a `key` across two model classes                   | Rename one — the registry throws on collision at boot                                                  |
| Overriding the runner to execute an anonymize transform inline | Wait for `TODO(retention-anonymize-pii)` to specify the per-model contract, then plug in via that seam |
| Reading `env()` in the runner                                  | Every knob lives in `config/retention.php` — inject via `#[Config('retention.*')]` when needed         |

## Deferrals

- **`TODO(retention-archive-storage)`** — the `Archive` action branch is a no-op
  today. Each `RetentionAction::Archive` model needs a per-model archive
  transform (schema, retention on the archive itself, downstream reads) that
  only the owner package can specify. The runner logs a WARNING and leaves rows
  untouched so operators see the deferred behaviour on every run.
- **`TODO(retention-anonymize-pii)`** — the `Anonymize` action branch is a no-op
  today. Each `RetentionAction::Anonymize` model needs a declaration of which
  columns to null / hash and null-safe fallbacks for downstream reads. The
  runner logs a WARNING and leaves rows untouched.

Both markers ship on models today without side effect; the runner surfaces the
deferred behaviour clearly on every invocation so operators know exactly which
policies are pending implementation.
