<?php

declare(strict_types=1);

namespace Academorix\Activity\Concerns;

use Illuminate\Support\Str;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

/**
 * Opt-in trait for logging a model's lifecycle to the activity feed.
 *
 * Wraps spatie's `LogsActivity` and layers our defaults:
 *
 *   - `log_name` is auto-derived from the model's short class name in
 *     kebab-case (`Branch` → `branch`, `TenantContact` → `tenant-contact`).
 *   - `LogOptions::defaults()->logAll()->logOnlyDirty()->dontSubmitEmptyLogs()` —
 *     spatie's own defaults, applied consistently across every model.
 *   - `tenant_id` is auto-filled by our `Activity` model's
 *     `BelongsToTenant` trait on `saving` (nothing to do here).
 *
 * Models that need finer control override `activityLogName()` (change
 * the log_name) or override `getActivitylogOptions()` outright (change
 * the entire log-options contract).
 *
 * ## Example
 *
 * ```php
 * use Academorix\Activity\Concerns\HasActivityLog;
 *
 * final class Branch extends Model
 * {
 *     use HasActivityLog;
 * }
 * ```
 *
 * ## Overriding log_name
 *
 * ```php
 * final class TenantContact extends Model
 * {
 *     use HasActivityLog;
 *
 *     protected static function activityLogName(): string
 *     {
 *         return 'contact'; // instead of 'tenant-contact'
 *     }
 * }
 * ```
 *
 * ## Do NOT also compose spatie's `LogsActivity` directly.
 *
 * This trait already `use`s it internally. Composing both raises
 * `TraitCollisionException` in PHP 8.
 *
 * @category Activity
 *
 * @since    0.1.0
 */
trait HasActivityLog
{
    use LogsActivity;

    /**
     * Return the spatie `LogOptions` for this model.
     *
     * Consumers may override to change the whole contract; the
     * default here is the most common shape across the codebase:
     * log every column, only include dirty changes on updates, and
     * never emit rows for empty (no-diff) events.
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName(static::activityLogName());
    }

    /**
     * Log-name for every activity row emitted by this model.
     *
     * Default: the model's short class name in kebab-case.
     * `App\Models\TenantContact` → `tenant-contact`. Consumers
     * override this method (never the property) to change the log
     * name; changing at runtime requires a `->useLogName(...)` call
     * on the returned `LogOptions`.
     */
    protected static function activityLogName(): string
    {
        return Str::kebab(\class_basename(static::class));
    }
}
