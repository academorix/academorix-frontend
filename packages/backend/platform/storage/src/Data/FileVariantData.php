<?php

declare(strict_types=1);

namespace Stackra\Storage\Data;

use Stackra\Storage\Contracts\Data\FileVariantInterface;
use Stackra\Storage\Models\FileVariant;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see FileVariant}.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class FileVariantData extends Data
{
    /**
     * @param  string                     $id            Prefixed ULID `fvr_<26>`.
     * @param  string                     $fileId        Parent File id.
     * @param  string                     $tenantId      Denormalised tenant.
     * @param  string                     $variantKey    Recipe key.
     * @param  string                     $mimeType      Variant MIME.
     * @param  int                        $sizeBytes     Byte count.
     * @param  int|null                   $width         Pixel width (images/videos).
     * @param  int|null                   $height        Pixel height.
     * @param  \DateTimeInterface         $generatedAt   When produced.
     * @param  \DateTimeInterface         $createdAt     Row creation.
     * @param  array<string, mixed>|null  $metadata      Recipe metadata.
     */
    public function __construct(
        public string $id,
        public string $fileId,
        public string $tenantId,
        public string $variantKey,
        public string $mimeType,
        public int $sizeBytes,
        public ?int $width,
        public ?int $height,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $generatedAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $createdAt,
        /** @var array<string, mixed>|null */
        public ?array $metadata = null,
    ) {
    }

    public static function fromModel(FileVariant $v): self
    {
        return new self(
            id: (string) $v->getKey(),
            fileId: (string) $v->{FileVariantInterface::ATTR_FILE_ID},
            tenantId: (string) $v->{FileVariantInterface::ATTR_TENANT_ID},
            variantKey: (string) $v->{FileVariantInterface::ATTR_VARIANT_KEY},
            mimeType: (string) $v->{FileVariantInterface::ATTR_MIME_TYPE},
            sizeBytes: (int) $v->{FileVariantInterface::ATTR_SIZE_BYTES},
            width: $v->{FileVariantInterface::ATTR_WIDTH},
            height: $v->{FileVariantInterface::ATTR_HEIGHT},
            generatedAt: $v->{FileVariantInterface::ATTR_GENERATED_AT},
            createdAt: $v->{FileVariantInterface::ATTR_CREATED_AT},
            metadata: $v->{FileVariantInterface::ATTR_METADATA},
        );
    }
}
