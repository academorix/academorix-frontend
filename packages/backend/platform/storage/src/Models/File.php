<?php

declare(strict_types=1);

namespace Stackra\Storage\Models;

use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Retention\Attributes\AsRetentionPolicy;
use Stackra\Retention\Enums\RetentionAction;
use Stackra\Storage\Concerns\IsFile;
use Stackra\Storage\Contracts\Data\FileInterface;
use Stackra\Storage\Contracts\Data\FileVariantInterface;
use Stackra\Storage\Database\Factories\FileFactory;
use Stackra\Storage\Enums\FileVisibility;
use Stackra\Storage\Enums\VirusScanState;
use Stackra\Storage\Observers\FileObserver;
use Stackra\Storage\Policies\FilePolicy;
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
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Mattiverse\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a {@see FileInterface}.
 *
 * Primary domain entity of the storage module. Polymorphic via
 * `fileable_type` / `fileable_id`. Content-addressable — every row
 * carries the `sha256` of its byte-stream and the physical blob is
 * shared across identical uploads via a refcount on the
 * ContentAddressableStore.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Table(
    name: FileInterface::TABLE,
    key: FileInterface::PRIMARY_KEY,
    keyType: FileInterface::KEY_TYPE,
)]
#[Fillable([
    FileInterface::ATTR_TENANT_ID,
    FileInterface::ATTR_OWNER_ID,
    FileInterface::ATTR_FILEABLE_TYPE,
    FileInterface::ATTR_FILEABLE_ID,
    FileInterface::ATTR_KIND,
    FileInterface::ATTR_COLLECTION,
    FileInterface::ATTR_FILENAME,
    FileInterface::ATTR_NAME,
    FileInterface::ATTR_MIME_TYPE,
    FileInterface::ATTR_SIZE_BYTES,
    FileInterface::ATTR_SHA256,
    FileInterface::ATTR_DISK,
    FileInterface::ATTR_PATH,
    FileInterface::ATTR_VISIBILITY,
    FileInterface::ATTR_VIRUS_SCAN_STATE,
    FileInterface::ATTR_VIRUS_SCAN_DETAILS,
    FileInterface::ATTR_SCANNED_AT,
    FileInterface::ATTR_DEDUPABLE,
    FileInterface::ATTR_REFERENCE_COUNT,
    FileInterface::ATTR_GENERATED_VARIANTS,
    FileInterface::ATTR_IS_SYSTEM,
    FileInterface::ATTR_ORIGINAL_URL,
    FileInterface::ATTR_ARCHIVED_AT,
    FileInterface::ATTR_CUSTOM_PROPERTIES,
    FileInterface::ATTR_METADATA,
])]
#[UseFactory(FileFactory::class)]
#[UsePolicy(FilePolicy::class)]
#[ObservedBy([FileObserver::class])]
#[WithoutIncrementing]
#[AsRetentionPolicy(
    key: 'storage.file',
    label: 'Archived Files',
    description: 'Hard-delete `files` rows soft-deleted more than 365 days ago; releases the shared blob when the refcount hits zero.',
    retentionDays: 365,
    action: RetentionAction::HardDelete,
)]
final class File extends Model implements AuditableContract, FileInterface
{
    use Auditable;
    use BelongsToTenant;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use IsFile;
    use SoftDeletes;
    use Userstamps;

    /**
     * Hidden by default on the wire — internals or high-value data.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        FileInterface::ATTR_PATH,
        FileInterface::ATTR_SHA256,
        FileInterface::ATTR_DISK,
        FileInterface::ATTR_REFERENCE_COUNT,
    ];

    /**
     * Cast map — enums, JSON, booleans, and datetimes coerced on
     * hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        FileInterface::ATTR_VISIBILITY         => FileVisibility::class,
        FileInterface::ATTR_VIRUS_SCAN_STATE   => VirusScanState::class,
        FileInterface::ATTR_SIZE_BYTES         => 'integer',
        FileInterface::ATTR_REFERENCE_COUNT    => 'integer',
        FileInterface::ATTR_IS_SYSTEM          => 'boolean',
        FileInterface::ATTR_DEDUPABLE          => 'boolean',
        FileInterface::ATTR_GENERATED_VARIANTS => 'array',
        FileInterface::ATTR_VIRUS_SCAN_DETAILS => 'array',
        FileInterface::ATTR_CUSTOM_PROPERTIES  => 'array',
        FileInterface::ATTR_METADATA           => 'array',
        FileInterface::ATTR_SCANNED_AT         => 'datetime',
        FileInterface::ATTR_ARCHIVED_AT        => 'datetime',
    ];

    /**
     * Polymorphic parent — the aggregate this file is attached to.
     *
     * @return MorphTo<Model, $this>
     */
    public function fileable(): MorphTo
    {
        /** @var MorphTo<Model, $this> $relation */
        $relation = $this->morphTo(
            'fileable',
            FileInterface::ATTR_FILEABLE_TYPE,
            FileInterface::ATTR_FILEABLE_ID,
        );

        return $relation;
    }

    /**
     * Derived renditions of this file (thumbnails, medium, hero …).
     *
     * @return HasMany<FileVariant, $this>
     */
    public function variants(): HasMany
    {
        /** @var HasMany<FileVariant, $this> $relation */
        $relation = $this->hasMany(FileVariant::class, FileVariantInterface::ATTR_FILE_ID);

        return $relation;
    }

    /**
     * Whether the antivirus scan flagged this file as clean.
     */
    public function isClean(): bool
    {
        return $this->{FileInterface::ATTR_VIRUS_SCAN_STATE} === VirusScanState::Clean;
    }

    /**
     * Whether the file has been quarantined by the antivirus scanner.
     */
    public function isQuarantined(): bool
    {
        return $this->{FileInterface::ATTR_VIRUS_SCAN_STATE} === VirusScanState::Quarantined;
    }
}
