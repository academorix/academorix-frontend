<?php

declare(strict_types=1);

namespace Stackra\Transfer\Models;

use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Tenancy\Concerns\BelongsToTenant;
use Stackra\Transfer\Contracts\Data\XferArtifactInterface;
use Stackra\Transfer\Contracts\Data\XferJobInterface;
use Stackra\Transfer\Database\Factories\XferArtifactFactory;
use Stackra\Transfer\Enums\ExportFormat;
use Stackra\Transfer\Enums\XferArtifactKind;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Eloquent model for an {@see XferArtifactInterface}.
 *
 * File output ledger — one row per generated file. `path` +
 * `checksum_sha256` are wire-hidden per the data-classes tier;
 * `purged_at` marks the row as tombstoned after retention.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Table(
    name: XferArtifactInterface::TABLE,
    key: XferArtifactInterface::PRIMARY_KEY,
    keyType: XferArtifactInterface::KEY_TYPE,
)]
#[Fillable([
    XferArtifactInterface::ATTR_TENANT_ID,
    XferArtifactInterface::ATTR_XFER_JOB_ID,
    XferArtifactInterface::ATTR_KIND,
    XferArtifactInterface::ATTR_FORMAT,
    XferArtifactInterface::ATTR_DISK,
    XferArtifactInterface::ATTR_PATH,
    XferArtifactInterface::ATTR_FILENAME,
    XferArtifactInterface::ATTR_MIME_TYPE,
    XferArtifactInterface::ATTR_SIZE_BYTES,
    XferArtifactInterface::ATTR_ROW_COUNT,
    XferArtifactInterface::ATTR_CHECKSUM_SHA256,
    XferArtifactInterface::ATTR_RETENTION_EXPIRES_AT,
    XferArtifactInterface::ATTR_PURGED_AT,
    XferArtifactInterface::ATTR_CREATED_BY_TYPE,
    XferArtifactInterface::ATTR_CREATED_BY_ID,
])]
#[UseFactory(XferArtifactFactory::class)]
#[WithoutIncrementing]
final class XferArtifact extends Model implements XferArtifactInterface
{
    use BelongsToTenant;
    use HasFactory;
    use HasPrefixedUlid;

    /**
     * Cast map — enums + integers + datetimes coerced on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        XferArtifactInterface::ATTR_KIND                 => XferArtifactKind::class,
        XferArtifactInterface::ATTR_FORMAT               => ExportFormat::class,
        XferArtifactInterface::ATTR_SIZE_BYTES           => 'integer',
        XferArtifactInterface::ATTR_ROW_COUNT            => 'integer',
        XferArtifactInterface::ATTR_RETENTION_EXPIRES_AT => 'datetime',
        XferArtifactInterface::ATTR_PURGED_AT            => 'datetime',
    ];

    /**
     * Wire-hidden columns — `path` and `checksum_sha256` are
     * confidential + restricted per the data-classes tier.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        XferArtifactInterface::ATTR_PATH,
        XferArtifactInterface::ATTR_CHECKSUM_SHA256,
    ];

    /**
     * Owning job.
     *
     * @return BelongsTo<XferJob, $this>
     */
    public function job(): BelongsTo
    {
        return $this->belongsTo(XferJob::class, XferArtifactInterface::ATTR_XFER_JOB_ID, XferJobInterface::ATTR_ID);
    }

    /**
     * Whether the artifact file has been purged from disk.
     */
    public function isPurged(): bool
    {
        return $this->{XferArtifactInterface::ATTR_PURGED_AT} !== null;
    }
}
