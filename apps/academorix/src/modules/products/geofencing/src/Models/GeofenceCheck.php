<?php

declare(strict_types=1);

namespace Stackra\Geofencing\Models;

use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Geofencing\Contracts\Data\GeofenceCheckInterface;
use Stackra\Geofencing\Database\Factories\GeofenceCheckFactory;
use Stackra\Geofencing\Enums\GeofenceMode;
use Stackra\Geofencing\Enums\GeofenceResult;
use Stackra\Geofencing\Observers\GeofenceCheckObserver;
use Stackra\Geofencing\Policies\GeofenceCheckPolicy;
use Stackra\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Mattiverse\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;
use RuntimeException;

/**
 * Eloquent model for a {@see GeofenceCheckInterface}.
 *
 * Immutable evaluation audit log. `saving` hook throws
 * {@see RuntimeException} on any update to a persisted row so overrides are
 * modelled as NEW rows with `supersedes_check_id` pointing at the original.
 * Soft-delete flows through `runSoftDelete()` which does not fire `saving`,
 * keeping the GDPR retention path open.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
#[Table(
    name: GeofenceCheckInterface::TABLE,
    key: GeofenceCheckInterface::PRIMARY_KEY,
    keyType: GeofenceCheckInterface::KEY_TYPE,
)]
#[Fillable([
    GeofenceCheckInterface::ATTR_TENANT_ID,
    GeofenceCheckInterface::ATTR_FENCEABLE_TYPE,
    GeofenceCheckInterface::ATTR_FENCEABLE_ID,
    GeofenceCheckInterface::ATTR_SUBJECT_TYPE,
    GeofenceCheckInterface::ATTR_SUBJECT_ID,
    GeofenceCheckInterface::ATTR_RESULT,
    GeofenceCheckInterface::ATTR_MODE,
    GeofenceCheckInterface::ATTR_CAPTURED_LOCATION,
    GeofenceCheckInterface::ATTR_ACCURACY_M,
    GeofenceCheckInterface::ATTR_DISTANCE_TO_FENCE_M,
    GeofenceCheckInterface::ATTR_EVALUATED_AT,
    GeofenceCheckInterface::ATTR_SUPERSEDES_CHECK_ID,
    GeofenceCheckInterface::ATTR_OVERRIDE_TASK_ID,
    GeofenceCheckInterface::ATTR_OVERRIDDEN_BY_USER_ID,
    GeofenceCheckInterface::ATTR_OVERRIDE_REASON,
    GeofenceCheckInterface::ATTR_METADATA,
])]
#[UseFactory(GeofenceCheckFactory::class)]
#[UsePolicy(GeofenceCheckPolicy::class)]
#[ObservedBy([GeofenceCheckObserver::class])]
#[WithoutIncrementing]
final class GeofenceCheck extends Model implements AuditableContract, GeofenceCheckInterface
{
    use Auditable;
    use BelongsToTenant;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use SoftDeletes;
    use Userstamps;

    /**
     * Cast map — enums + numerics + datetimes coerced on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        GeofenceCheckInterface::ATTR_RESULT              => GeofenceResult::class,
        GeofenceCheckInterface::ATTR_MODE                => GeofenceMode::class,
        GeofenceCheckInterface::ATTR_ACCURACY_M          => 'integer',
        GeofenceCheckInterface::ATTR_DISTANCE_TO_FENCE_M => 'float',
        GeofenceCheckInterface::ATTR_EVALUATED_AT        => 'datetime',
        GeofenceCheckInterface::ATTR_METADATA            => 'array',
    ];

    /**
     * Audit-log only the fields carrying disputable meaning. Location +
     * accuracy skip audit — they're already on the row verbatim + can't
     * change (immutability guard).
     *
     * @var array<int, string>
     */
    protected array $auditInclude = [
        GeofenceCheckInterface::ATTR_RESULT,
        GeofenceCheckInterface::ATTR_MODE,
        GeofenceCheckInterface::ATTR_DISTANCE_TO_FENCE_M,
        GeofenceCheckInterface::ATTR_OVERRIDDEN_BY_USER_ID,
        GeofenceCheckInterface::ATTR_SUPERSEDES_CHECK_ID,
    ];

    /**
     * Register the immutability guard. Application code can INSERT rows;
     * updates on a persisted row raise. `SoftDeletes::runSoftDelete()`
     * bypasses the `saving` event (it uses the query builder directly), so
     * the retention path stays open.
     */
    protected static function booted(): void
    {
        static::saving(static function (GeofenceCheck $check): void {
            if ($check->exists === true) {
                throw new RuntimeException(
                    'GeofenceCheck rows are immutable — cannot be updated. Model an override as a NEW row with supersedes_check_id.',
                );
            }
        });
    }

    /**
     * The polymorphic fenceable — WHAT the check ran against.
     *
     * @return MorphTo<Model, $this>
     */
    public function fenceable(): MorphTo
    {
        return $this->morphTo(
            'fenceable',
            GeofenceCheckInterface::ATTR_FENCEABLE_TYPE,
            GeofenceCheckInterface::ATTR_FENCEABLE_ID,
        );
    }

    /**
     * The polymorphic subject — WHY the check ran.
     *
     * @return MorphTo<Model, $this>
     */
    public function subject(): MorphTo
    {
        return $this->morphTo(
            'subject',
            GeofenceCheckInterface::ATTR_SUBJECT_TYPE,
            GeofenceCheckInterface::ATTR_SUBJECT_ID,
        );
    }

    /**
     * The original check this row supersedes (only set on override rows).
     *
     * @return BelongsTo<GeofenceCheck, $this>
     */
    public function supersedes(): BelongsTo
    {
        return $this->belongsTo(
            self::class,
            GeofenceCheckInterface::ATTR_SUPERSEDES_CHECK_ID,
        );
    }

    /**
     * Whether this row is an override.
     */
    public function isOverride(): bool
    {
        return $this->{GeofenceCheckInterface::ATTR_SUPERSEDES_CHECK_ID} !== null;
    }
}
