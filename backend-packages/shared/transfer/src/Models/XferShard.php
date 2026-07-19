<?php

declare(strict_types=1);

namespace Academorix\Transfer\Models;

use Academorix\Database\Concerns\HasPrefixedUlid;
use Academorix\Tenancy\Concerns\BelongsToTenant;
use Academorix\Transfer\Contracts\Data\XferJobInterface;
use Academorix\Transfer\Contracts\Data\XferShardInterface;
use Academorix\Transfer\Database\Factories\XferShardFactory;
use Academorix\Transfer\Enums\XferShardStatus;
use Academorix\Transfer\Observers\XferShardObserver;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Eloquent model for an {@see XferShardInterface}.
 *
 * Sub-job for a range-limited slice of a sharded import or export.
 * Lightweight — no dual-write auditing; the aggregate-level trail on
 * the parent {@see XferJob} covers it.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Table(
    name: XferShardInterface::TABLE,
    key: XferShardInterface::PRIMARY_KEY,
    keyType: XferShardInterface::KEY_TYPE,
)]
#[Fillable([
    XferShardInterface::ATTR_TENANT_ID,
    XferShardInterface::ATTR_XFER_JOB_ID,
    XferShardInterface::ATTR_INDEX,
    XferShardInterface::ATTR_SHEET_NAME,
    XferShardInterface::ATTR_OFFSET,
    XferShardInterface::ATTR_LIMIT,
    XferShardInterface::ATTR_STATUS,
    XferShardInterface::ATTR_ATTEMPT,
    XferShardInterface::ATTR_STARTED_AT,
    XferShardInterface::ATTR_FINISHED_AT,
    XferShardInterface::ATTR_ERROR_CODE,
    XferShardInterface::ATTR_ERROR_MESSAGE,
    XferShardInterface::ATTR_COUNTERS,
])]
#[UseFactory(XferShardFactory::class)]
#[ObservedBy([XferShardObserver::class])]
#[WithoutIncrementing]
final class XferShard extends Model implements XferShardInterface
{
    use BelongsToTenant;
    use HasFactory;
    use HasPrefixedUlid;

    /**
     * Cast map — enum + JSON + datetime coercion on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        XferShardInterface::ATTR_STATUS       => XferShardStatus::class,
        XferShardInterface::ATTR_COUNTERS     => 'array',
        XferShardInterface::ATTR_INDEX        => 'integer',
        XferShardInterface::ATTR_OFFSET       => 'integer',
        XferShardInterface::ATTR_LIMIT        => 'integer',
        XferShardInterface::ATTR_ATTEMPT      => 'integer',
        XferShardInterface::ATTR_STARTED_AT   => 'datetime',
        XferShardInterface::ATTR_FINISHED_AT  => 'datetime',
    ];

    /**
     * Parent job.
     *
     * @return BelongsTo<XferJob, $this>
     */
    public function job(): BelongsTo
    {
        return $this->belongsTo(XferJob::class, XferShardInterface::ATTR_XFER_JOB_ID, XferJobInterface::ATTR_ID);
    }
}
