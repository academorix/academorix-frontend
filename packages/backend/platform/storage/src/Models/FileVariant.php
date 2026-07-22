<?php

declare(strict_types=1);

namespace Stackra\Storage\Models;

use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Storage\Contracts\Data\FileVariantInterface;
use Stackra\Storage\Database\Factories\FileVariantFactory;
use Stackra\Storage\Observers\FileVariantObserver;
use Stackra\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Wildside\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a {@see FileVariantInterface}.
 *
 * Derived rendition of a {@see File}. Regeneratable, hard-deleted
 * with the parent (no `SoftDeletes` — variants are always
 * reproducible from the source).
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Table(
    name: FileVariantInterface::TABLE,
    key: FileVariantInterface::PRIMARY_KEY,
    keyType: FileVariantInterface::KEY_TYPE,
)]
#[Fillable([
    FileVariantInterface::ATTR_FILE_ID,
    FileVariantInterface::ATTR_TENANT_ID,
    FileVariantInterface::ATTR_VARIANT_KEY,
    FileVariantInterface::ATTR_GENERATED_BY_CONVERSION,
    FileVariantInterface::ATTR_MIME_TYPE,
    FileVariantInterface::ATTR_WIDTH,
    FileVariantInterface::ATTR_HEIGHT,
    FileVariantInterface::ATTR_SIZE_BYTES,
    FileVariantInterface::ATTR_DISK,
    FileVariantInterface::ATTR_PATH,
    FileVariantInterface::ATTR_GENERATED_AT,
    FileVariantInterface::ATTR_METADATA,
])]
#[UseFactory(FileVariantFactory::class)]
#[ObservedBy([FileVariantObserver::class])]
#[WithoutIncrementing]
final class FileVariant extends Model implements AuditableContract, FileVariantInterface
{
    use Auditable;
    use BelongsToTenant;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use Userstamps;

    /**
     * Hidden internals.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        FileVariantInterface::ATTR_PATH,
        FileVariantInterface::ATTR_DISK,
    ];

    /**
     * Cast map.
     *
     * @var array<string, string>
     */
    protected $casts = [
        FileVariantInterface::ATTR_WIDTH        => 'integer',
        FileVariantInterface::ATTR_HEIGHT       => 'integer',
        FileVariantInterface::ATTR_SIZE_BYTES   => 'integer',
        FileVariantInterface::ATTR_METADATA     => 'array',
        FileVariantInterface::ATTR_GENERATED_AT => 'datetime',
    ];

    /**
     * Parent file.
     *
     * @return BelongsTo<File, $this>
     */
    public function file(): BelongsTo
    {
        /** @var BelongsTo<File, $this> $relation */
        $relation = $this->belongsTo(File::class, FileVariantInterface::ATTR_FILE_ID);

        return $relation;
    }
}
