<?php

declare(strict_types=1);

namespace Stackra\Storage\Models;

use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Storage\Contracts\Data\ChunkedUploadInterface;
use Stackra\Storage\Database\Factories\ChunkedUploadFactory;
use Stackra\Storage\Enums\ChunkedUploadState;
use Stackra\Storage\Observers\ChunkedUploadObserver;
use Stackra\Storage\Policies\ChunkedUploadPolicy;
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
use Illuminate\Database\Eloquent\SoftDeletes;
use Mattiverse\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a {@see ChunkedUploadInterface}.
 *
 * In-flight multipart / tus.io state. State machine:
 * `initiating` → `uploading` → `finalizing` → `completed | aborted
 * | expired`.
 *
 * The `chunks` JSON column carries the per-chunk ledger so a client
 * resuming after a crash re-uploads only what's missing.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Table(
    name: ChunkedUploadInterface::TABLE,
    key: ChunkedUploadInterface::PRIMARY_KEY,
    keyType: ChunkedUploadInterface::KEY_TYPE,
)]
#[Fillable([
    ChunkedUploadInterface::ATTR_TENANT_ID,
    ChunkedUploadInterface::ATTR_OWNER_ID,
    ChunkedUploadInterface::ATTR_TARGET_KIND,
    ChunkedUploadInterface::ATTR_TARGET_FILEABLE_TYPE,
    ChunkedUploadInterface::ATTR_TARGET_FILEABLE_ID,
    ChunkedUploadInterface::ATTR_PROTOCOL,
    ChunkedUploadInterface::ATTR_UPLOAD_URL,
    ChunkedUploadInterface::ATTR_PROVIDER_UPLOAD_ID,
    ChunkedUploadInterface::ATTR_FILENAME,
    ChunkedUploadInterface::ATTR_DECLARED_MIME_TYPE,
    ChunkedUploadInterface::ATTR_DECLARED_SHA256,
    ChunkedUploadInterface::ATTR_TOTAL_SIZE_BYTES,
    ChunkedUploadInterface::ATTR_UPLOADED_BYTES,
    ChunkedUploadInterface::ATTR_CHUNKS,
    ChunkedUploadInterface::ATTR_CHUNK_SIZE_BYTES,
    ChunkedUploadInterface::ATTR_STATE,
    ChunkedUploadInterface::ATTR_EXPIRES_AT,
    ChunkedUploadInterface::ATTR_INITIATED_AT,
    ChunkedUploadInterface::ATTR_FINALIZED_AT,
    ChunkedUploadInterface::ATTR_ABORT_REASON,
    ChunkedUploadInterface::ATTR_RESULTING_FILE_ID,
    ChunkedUploadInterface::ATTR_METADATA,
])]
#[UseFactory(ChunkedUploadFactory::class)]
#[UsePolicy(ChunkedUploadPolicy::class)]
#[ObservedBy([ChunkedUploadObserver::class])]
#[WithoutIncrementing]
final class ChunkedUpload extends Model implements AuditableContract, ChunkedUploadInterface
{
    use Auditable;
    use BelongsToTenant;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use SoftDeletes;
    use Userstamps;

    /**
     * Hidden — the `upload_url` is only returned on initiate, and
     * the `provider_upload_id` is a provider-side secret.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        ChunkedUploadInterface::ATTR_UPLOAD_URL,
        ChunkedUploadInterface::ATTR_PROVIDER_UPLOAD_ID,
    ];

    /**
     * Cast map.
     *
     * @var array<string, string>
     */
    protected $casts = [
        ChunkedUploadInterface::ATTR_STATE             => ChunkedUploadState::class,
        ChunkedUploadInterface::ATTR_TOTAL_SIZE_BYTES  => 'integer',
        ChunkedUploadInterface::ATTR_UPLOADED_BYTES    => 'integer',
        ChunkedUploadInterface::ATTR_CHUNK_SIZE_BYTES  => 'integer',
        ChunkedUploadInterface::ATTR_CHUNKS            => 'array',
        ChunkedUploadInterface::ATTR_METADATA          => 'array',
        ChunkedUploadInterface::ATTR_EXPIRES_AT        => 'datetime',
        ChunkedUploadInterface::ATTR_INITIATED_AT      => 'datetime',
        ChunkedUploadInterface::ATTR_FINALIZED_AT      => 'datetime',
    ];

    /**
     * Once the upload finalises, the resulting File.
     *
     * @return BelongsTo<File, $this>
     */
    public function resultingFile(): BelongsTo
    {
        /** @var BelongsTo<File, $this> $relation */
        $relation = $this->belongsTo(File::class, ChunkedUploadInterface::ATTR_RESULTING_FILE_ID);

        return $relation;
    }

    /**
     * Upload progress, 0..100.
     */
    public function progressPct(): float
    {
        $total = (int) $this->{ChunkedUploadInterface::ATTR_TOTAL_SIZE_BYTES};
        if ($total <= 0) {
            return 0.0;
        }

        $done = (int) $this->{ChunkedUploadInterface::ATTR_UPLOADED_BYTES};

        return \round(($done / $total) * 100, 2);
    }
}
