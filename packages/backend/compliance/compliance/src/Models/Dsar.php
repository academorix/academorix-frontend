<?php

declare(strict_types=1);

namespace Stackra\Compliance\Models;

use Stackra\Compliance\Contracts\Data\DsarInterface;
use Stackra\Compliance\Database\Factories\DsarFactory;
use Stackra\Compliance\Enums\DsarAction;
use Stackra\Compliance\Enums\DsarState;
use Stackra\Compliance\Observers\DsarObserver;
use Stackra\Compliance\Policies\DsarPolicy;
use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Mattiverse\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a {@see DsarInterface}.
 *
 * Data-subject request state machine. Composes SoftDeletes so a
 * cancelled DSAR can be inspected in retro before hard-purge lands.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Table(
    name: DsarInterface::TABLE,
    key: DsarInterface::PRIMARY_KEY,
    keyType: DsarInterface::KEY_TYPE,
)]
#[Fillable([
    DsarInterface::ATTR_TENANT_ID,
    DsarInterface::ATTR_SUBJECT_TYPE,
    DsarInterface::ATTR_SUBJECT_ID,
    DsarInterface::ATTR_ACTION,
    DsarInterface::ATTR_STATE,
    DsarInterface::ATTR_ASSIGNED_REVIEWER_ID,
    DsarInterface::ATTR_REQUESTED_AT,
    DsarInterface::ATTR_VERIFIED_AT,
    DsarInterface::ATTR_DELIVERED_AT,
    DsarInterface::ATTR_REJECTED_AT,
    DsarInterface::ATTR_REJECTION_REASON,
    DsarInterface::ATTR_SLA_DAYS,
    DsarInterface::ATTR_ARTEFACT_COUNT,
    DsarInterface::ATTR_DOWNLOAD_SIGNATURE,
    DsarInterface::ATTR_DOWNLOAD_EXPIRES_AT,
    DsarInterface::ATTR_NOTES,
    DsarInterface::ATTR_METADATA,
])]
#[UseFactory(DsarFactory::class)]
#[UsePolicy(DsarPolicy::class)]
#[ObservedBy([DsarObserver::class])]
#[WithoutIncrementing]
final class Dsar extends Model implements AuditableContract, DsarInterface
{
    use Auditable;
    use BelongsToTenant;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use SoftDeletes;
    use Userstamps;

    /**
     * Cast map — enums + datetimes + integers coerced on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        DsarInterface::ATTR_STATE               => DsarState::class,
        DsarInterface::ATTR_ACTION              => DsarAction::class,
        DsarInterface::ATTR_REQUESTED_AT        => 'datetime',
        DsarInterface::ATTR_VERIFIED_AT         => 'datetime',
        DsarInterface::ATTR_DELIVERED_AT        => 'datetime',
        DsarInterface::ATTR_REJECTED_AT         => 'datetime',
        DsarInterface::ATTR_DOWNLOAD_EXPIRES_AT => 'datetime',
        DsarInterface::ATTR_SLA_DAYS            => 'integer',
        DsarInterface::ATTR_ARTEFACT_COUNT      => 'integer',
    ];

    /**
     * Per-module artefacts assembled into the DSAR bundle.
     *
     * @return HasMany<DsarArtefact, $this>
     */
    public function artefacts(): HasMany
    {
        return $this->hasMany(
            DsarArtefact::class,
            \Stackra\Compliance\Contracts\Data\DsarArtefactInterface::ATTR_DSAR_ID,
        );
    }
}
