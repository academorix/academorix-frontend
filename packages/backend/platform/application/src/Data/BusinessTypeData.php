<?php

declare(strict_types=1);

namespace Stackra\Application\Data;

use Stackra\Application\Contracts\Data\BusinessTypeInterface;
use Stackra\Application\Enums\BusinessTypeEnum;
use Stackra\Application\Models\BusinessType;
use Spatie\LaravelData\Attributes\Computed;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see BusinessType}.
 *
 * `resolvedEnum` is the code-primary enum case — `Custom` when the
 * row is a tenant custom outside the shipped taxonomy. Consumers
 * branch on this in code; the `slug` field is the raw storage key.
 *
 * @category Application
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class BusinessTypeData extends Data
{
    /**
     * @param  string  $id  Prefixed ULID (`bst_<26 chars>`).
     * @param  string  $slug  Enum-backed identifier or tenant-generated slug.
     * @param  string  $label  Active-locale display copy.
     * @param  int     $sortOrder  Ordering in the self-serve picker.
     * @param  bool    $isSystem  True for platform-seeded rows (immutable via HTTP).
     * @param  bool    $isVisible  Whether the row appears in the self-serve picker.
     * @param  \DateTimeInterface  $createdAt
     * @param  \DateTimeInterface  $updatedAt
     * @param  string|null  $tenantId  Null for platform defaults; set for tenant customs.
     * @param  string|null  $description  Active-locale longer copy.
     * @param  string|null  $icon  Iconify token.
     * @param  string|null  $heroImageUrl
     * @param  array<string, array<string, string>>|null  $translations  Per-locale content when ?include=translations.
     * @param  \DateTimeInterface|null  $deletedAt
     */
    public function __construct(
        public string $id,
        public string $slug,
        public string $label,
        public int $sortOrder,
        public bool $isSystem,
        public bool $isVisible,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $createdAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $updatedAt,
        public ?string $tenantId = null,
        public ?string $description = null,
        public ?string $icon = null,
        public ?string $heroImageUrl = null,
        public ?array $translations = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $deletedAt = null,

        /**
         * Code-primary enum case. `Custom` when slug is outside the
         * shipped taxonomy — consumers branch on this for feature +
         * terminology + role defaults.
         */
        #[Computed]
        public BusinessTypeEnum $resolvedEnum = BusinessTypeEnum::Custom,
    ) {
        $this->resolvedEnum = BusinessTypeEnum::resolve($this->slug);
    }

    /**
     * Custom mapping from a BusinessType model.
     */
    public static function fromModel(BusinessType $type): self
    {
        return new self(
            id: (string) $type->getKey(),
            slug: (string) $type->{BusinessTypeInterface::ATTR_SLUG},
            label: (string) $type->{BusinessTypeInterface::ATTR_LABEL},
            sortOrder: (int) $type->{BusinessTypeInterface::ATTR_SORT_ORDER},
            isSystem: (bool) $type->{BusinessTypeInterface::ATTR_IS_SYSTEM},
            isVisible: (bool) $type->{BusinessTypeInterface::ATTR_IS_VISIBLE},
            createdAt: $type->{BusinessTypeInterface::ATTR_CREATED_AT},
            updatedAt: $type->{BusinessTypeInterface::ATTR_UPDATED_AT},
            tenantId: $type->{BusinessTypeInterface::ATTR_TENANT_ID},
            description: $type->{BusinessTypeInterface::ATTR_DESCRIPTION},
            icon: $type->{BusinessTypeInterface::ATTR_ICON},
            heroImageUrl: $type->{BusinessTypeInterface::ATTR_HERO_IMAGE_URL},
            translations: $type->{BusinessTypeInterface::ATTR_TRANSLATIONS},
            deletedAt: $type->{BusinessTypeInterface::ATTR_DELETED_AT},
        );
    }
}
