<?php

declare(strict_types=1);

namespace Stackra\Transfer\Models;

use Stackra\Activity\Concerns\HasActivityLog;
use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Tenancy\Concerns\BelongsToTenant;
use Stackra\Transfer\Contracts\Data\XferArtifactInterface;
use Stackra\Transfer\Contracts\Data\XferJobInterface;
use Stackra\Transfer\Contracts\Data\XferShardInterface;
use Stackra\Transfer\Database\Factories\XferJobFactory;
use Stackra\Transfer\Enums\ImportFormat;
use Stackra\Transfer\Enums\ImportMode;
use Stackra\Transfer\Enums\XferJobStatus;
use Stackra\Transfer\Enums\XferKind;
use Stackra\Transfer\Observers\XferJobObserver;
use Stackra\Transfer\Policies\XferJobPolicy;
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
use Wildside\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for an {@see XferJobInterface}.
 *
 * The operation record — persists independently of the queue job's
 * lifetime. Composes the full observability stack — every status
 * transition writes both an activity row (product feed) and an
 * audit row (compliance trail) — and the tenancy trait so every
 * read is auto-scoped to the active tenant.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Table(
    name: XferJobInterface::TABLE,
    key: XferJobInterface::PRIMARY_KEY,
    keyType: XferJobInterface::KEY_TYPE,
)]
#[Fillable([
    XferJobInterface::ATTR_TENANT_ID,
    XferJobInterface::ATTR_KIND,
    XferJobInterface::ATTR_ENTITY_KEY,
    XferJobInterface::ATTR_FORMAT,
    XferJobInterface::ATTR_MODE,
    XferJobInterface::ATTR_STATUS,
    XferJobInterface::ATTR_INITIATOR_USER_ID,
    XferJobInterface::ATTR_SOURCE_PATH,
    XferJobInterface::ATTR_SOURCE_SIZE_BYTES,
    XferJobInterface::ATTR_SOURCE_ROW_COUNT,
    XferJobInterface::ATTR_NOTIFY_CHANNELS,
    XferJobInterface::ATTR_MAPPING_PROFILE_ID,
    XferJobInterface::ATTR_FILTERS,
    XferJobInterface::ATTR_INCLUDE_RELATIONS,
    XferJobInterface::ATTR_COLUMNS,
    XferJobInterface::ATTR_ERROR_ARTIFACT_ID,
    XferJobInterface::ATTR_RESULT_ARTIFACT_ID,
    XferJobInterface::ATTR_COUNTERS,
    XferJobInterface::ATTR_STARTED_AT,
    XferJobInterface::ATTR_COMPLETED_AT,
    XferJobInterface::ATTR_FAILED_REASON,
    XferJobInterface::ATTR_METADATA,
])]
#[UseFactory(XferJobFactory::class)]
#[UsePolicy(XferJobPolicy::class)]
#[ObservedBy([XferJobObserver::class])]
#[WithoutIncrementing]
final class XferJob extends Model implements AuditableContract, XferJobInterface
{
    use Auditable;
    use BelongsToTenant;
    use HasActivityLog;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use SoftDeletes;
    use Userstamps;

    /**
     * Cast map — enums + JSON blobs + datetime coercion on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        XferJobInterface::ATTR_KIND              => XferKind::class,
        XferJobInterface::ATTR_FORMAT            => ImportFormat::class,
        XferJobInterface::ATTR_MODE              => ImportMode::class,
        XferJobInterface::ATTR_STATUS            => XferJobStatus::class,
        XferJobInterface::ATTR_NOTIFY_CHANNELS   => 'array',
        XferJobInterface::ATTR_FILTERS           => 'array',
        XferJobInterface::ATTR_INCLUDE_RELATIONS => 'array',
        XferJobInterface::ATTR_COLUMNS           => 'array',
        XferJobInterface::ATTR_COUNTERS          => 'array',
        XferJobInterface::ATTR_METADATA          => 'array',
        XferJobInterface::ATTR_STARTED_AT        => 'datetime',
        XferJobInterface::ATTR_COMPLETED_AT      => 'datetime',
        XferJobInterface::ATTR_SOURCE_SIZE_BYTES => 'integer',
        XferJobInterface::ATTR_SOURCE_ROW_COUNT  => 'integer',
    ];

    /**
     * Shards belonging to this job.
     *
     * @return HasMany<XferShard, $this>
     */
    public function shards(): HasMany
    {
        return $this->hasMany(XferShard::class, XferShardInterface::ATTR_XFER_JOB_ID);
    }

    /**
     * Artifacts belonging to this job.
     *
     * @return HasMany<XferArtifact, $this>
     */
    public function artifacts(): HasMany
    {
        return $this->hasMany(XferArtifact::class, XferArtifactInterface::ATTR_XFER_JOB_ID);
    }

    /**
     * Whether the job is in a terminal state.
     */
    public function isTerminal(): bool
    {
        $status = $this->{XferJobInterface::ATTR_STATUS};

        return $status instanceof XferJobStatus && $status->isTerminal();
    }
}
