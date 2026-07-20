<?php

declare(strict_types=1);

namespace Academorix\Activity\Models;

use Academorix\Activity\Contracts\Data\ActivityInterface;
use Academorix\Activity\Database\Factories\ActivityFactory;
use Academorix\Activity\Policies\ActivityPolicy;
use Academorix\Database\Concerns\HasMetadata;
use Academorix\Database\Concerns\HasPrefixedUlid;
use Academorix\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;
use Spatie\Activitylog\Models\Activity as SpatieActivity;

/**
 * Eloquent model for an {@see ActivityInterface}.
 *
 * Extends `Spatie\Activitylog\Models\Activity` (spatie's own model)
 * and layers our conventions on top:
 *
 *   - `HasPrefixedUlid` — primary key becomes `act_<ulid>` on
 *     `creating`, overriding spatie's auto-increment bigint.
 *   - `BelongsToTenant` — read auto-scope to the active tenant + on
 *     `saving`, `tenant_id` is auto-filled from the resolved
 *     TenantContext.
 *   - `#[UseFactory]` — factory shipped in `database/factories/`.
 *   - `#[UsePolicy]` — see {@see ActivityPolicy}.
 *
 * NOT `final` — spatie's `Activity` isn't final, and consumers may
 * legitimately extend further (e.g. app-specific accessors). Every
 * mutation still routes through spatie's own hooks; we add columns
 * but never remove them.
 *
 * NOT composing `SoftDeletes` — activity_log is append-only per the
 * blueprint. Rows past their retention tier are hard-deleted by
 * `PruneActivityLogJob`.
 *
 * @category Activity
 *
 * @since    0.1.0
 */
#[UseFactory(ActivityFactory::class)]
#[UsePolicy(ActivityPolicy::class)]
class Activity extends SpatieActivity implements ActivityInterface, AuditableContract
{
    use Auditable;
    use BelongsToTenant;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;

    /**
     * Primary key type — string ULID overrides spatie's bigint default.
     *
     * @var string
     */
    protected $keyType = 'string';

    /**
     * The primary key auto-increments — false because we generate the
     * prefixed ULID ourselves via `HasPrefixedUlid`.
     *
     * @var bool
     */
    public $incrementing = false;

    /**
     * Fillable — spatie's own fillable list plus `tenant_id`. Kept
     * explicit (rather than inheriting) so consumers reading the
     * class in isolation know the exact column set.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        ActivityInterface::ATTR_LOG_NAME,
        ActivityInterface::ATTR_DESCRIPTION,
        ActivityInterface::ATTR_SUBJECT_TYPE,
        ActivityInterface::ATTR_SUBJECT_ID,
        ActivityInterface::ATTR_CAUSER_TYPE,
        ActivityInterface::ATTR_CAUSER_ID,
        ActivityInterface::ATTR_PROPERTIES,
        ActivityInterface::ATTR_BATCH_UUID,
        ActivityInterface::ATTR_EVENT,
        ActivityInterface::ATTR_TENANT_ID,
    ];

    /**
     * Get the table associated with the model — resolved from config
     * so consumer apps can swap the table name without patching the
     * model directly.
     */
    public function getTable(): string
    {
        return (string) \config('activity.table_name', ActivityInterface::TABLE);
    }
}
