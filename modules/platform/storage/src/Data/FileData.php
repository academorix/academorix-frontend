<?php

declare(strict_types=1);

namespace Academorix\Storage\Data;

use Academorix\Storage\Contracts\Data\FileInterface;
use Academorix\Storage\Enums\FileVisibility;
use Academorix\Storage\Enums\VirusScanState;
use Academorix\Storage\Models\File;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see File}.
 *
 * Excludes `path`, `sha256`, `disk`, and `reference_count` — those
 * are storage internals and the schema pins them as hidden.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class FileData extends Data
{
    /**
     * @param  string                     $id                  Prefixed ULID `fil_<26>`.
     * @param  string                     $tenantId            Owning tenant.
     * @param  string|null                $ownerId             Uploader (null for system).
     * @param  string|null                $fileableType        Polymorphic parent morph type.
     * @param  string|null                $fileableId          Polymorphic parent key.
     * @param  string                     $kind                Registered kind key.
     * @param  string                     $collection          spatie media collection.
     * @param  string                     $filename            Original filename.
     * @param  string                     $name                Display name (user-editable).
     * @param  string                     $mimeType            Sniffed MIME.
     * @param  int                        $sizeBytes           Byte count.
     * @param  FileVisibility             $visibility          public / private.
     * @param  VirusScanState             $virusScanState      Scan state.
     * @param  bool                       $isSystem            True for system rows.
     * @param  bool                       $dedupable           Participates in dedup.
     * @param  array<int, string>         $generatedVariantKeys Variant keys already generated.
     * @param  \DateTimeInterface         $createdAt           Row creation.
     * @param  \DateTimeInterface         $updatedAt           Last mutation.
     * @param  \DateTimeInterface|null    $scannedAt           Scan completion.
     * @param  \DateTimeInterface|null    $archivedAt          Archive marker.
     * @param  \DateTimeInterface|null    $deletedAt           Soft-delete marker.
     * @param  array<string, mixed>|null  $metadata            HasMetadata bag.
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public ?string $ownerId,
        public ?string $fileableType,
        public ?string $fileableId,
        public string $kind,
        public string $collection,
        public string $filename,
        public string $name,
        public string $mimeType,
        public int $sizeBytes,
        public FileVisibility $visibility,
        public VirusScanState $virusScanState,
        public bool $isSystem,
        public bool $dedupable,
        /** @var array<int, string> */
        public array $generatedVariantKeys,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $createdAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $updatedAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $scannedAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $archivedAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $deletedAt = null,
        /** @var array<string, mixed>|null */
        public ?array $metadata = null,
    ) {
    }

    /**
     * Build from a File model.
     */
    public static function fromModel(File $file): self
    {
        $visRaw = $file->{FileInterface::ATTR_VISIBILITY};
        $vis    = $visRaw instanceof FileVisibility ? $visRaw : (FileVisibility::tryFrom((string) $visRaw) ?? FileVisibility::Private);

        $vsRaw = $file->{FileInterface::ATTR_VIRUS_SCAN_STATE};
        $vs    = $vsRaw instanceof VirusScanState ? $vsRaw : (VirusScanState::tryFrom((string) $vsRaw) ?? VirusScanState::Pending);

        return new self(
            id: (string) $file->getKey(),
            tenantId: (string) $file->{FileInterface::ATTR_TENANT_ID},
            ownerId: $file->{FileInterface::ATTR_OWNER_ID},
            fileableType: $file->{FileInterface::ATTR_FILEABLE_TYPE},
            fileableId: $file->{FileInterface::ATTR_FILEABLE_ID},
            kind: (string) $file->{FileInterface::ATTR_KIND},
            collection: (string) $file->{FileInterface::ATTR_COLLECTION},
            filename: (string) $file->{FileInterface::ATTR_FILENAME},
            name: (string) $file->{FileInterface::ATTR_NAME},
            mimeType: (string) $file->{FileInterface::ATTR_MIME_TYPE},
            sizeBytes: (int) $file->{FileInterface::ATTR_SIZE_BYTES},
            visibility: $vis,
            virusScanState: $vs,
            isSystem: (bool) $file->{FileInterface::ATTR_IS_SYSTEM},
            dedupable: (bool) $file->{FileInterface::ATTR_DEDUPABLE},
            generatedVariantKeys: (array) ($file->{FileInterface::ATTR_GENERATED_VARIANTS} ?? []),
            createdAt: $file->{FileInterface::ATTR_CREATED_AT},
            updatedAt: $file->{FileInterface::ATTR_UPDATED_AT},
            scannedAt: $file->{FileInterface::ATTR_SCANNED_AT},
            archivedAt: $file->{FileInterface::ATTR_ARCHIVED_AT},
            deletedAt: $file->{FileInterface::ATTR_DELETED_AT},
            metadata: $file->{FileInterface::ATTR_METADATA},
        );
    }
}
