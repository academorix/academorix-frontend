<?php

declare(strict_types=1);

namespace Academorix\Settings\Data;

use Academorix\Settings\Contracts\Data\SettingsGroupInterface;
use Academorix\Settings\Models\SettingsGroup;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see SettingsGroup}.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class SettingsGroupData extends Data
{
    /**
     * @param  string                    $id           `sgr_<ulid>`.
     * @param  string                    $key          Stable group slug.
     * @param  string                    $name         Display name.
     * @param  bool                      $isSystem     Discovery-hydrated groups are locked.
     * @param  int                       $sortOrder    Navigator sort.
     * @param  \DateTimeInterface        $createdAt    Row creation.
     * @param  \DateTimeInterface        $updatedAt    Last mutation.
     * @param  string|null               $description  Free-form description.
     * @param  string|null               $icon         Semantic icon name.
     * @param  \DateTimeInterface|null   $deletedAt    Soft-delete marker.
     */
    public function __construct(
        public string $id,
        public string $key,
        public string $name,
        public bool $isSystem,
        public int $sortOrder,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $createdAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $updatedAt,
        public ?string $description = null,
        public ?string $icon = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $deletedAt = null,
    ) {
    }

    /**
     * Build from a model.
     */
    public static function fromModel(SettingsGroup $group): self
    {
        return new self(
            id: (string) $group->getKey(),
            key: (string) $group->{SettingsGroupInterface::ATTR_KEY},
            name: (string) $group->{SettingsGroupInterface::ATTR_NAME},
            isSystem: (bool) $group->{SettingsGroupInterface::ATTR_IS_SYSTEM},
            sortOrder: (int) $group->{SettingsGroupInterface::ATTR_SORT_ORDER},
            createdAt: $group->{SettingsGroupInterface::ATTR_CREATED_AT},
            updatedAt: $group->{SettingsGroupInterface::ATTR_UPDATED_AT},
            description: $group->{SettingsGroupInterface::ATTR_DESCRIPTION},
            icon: $group->{SettingsGroupInterface::ATTR_ICON},
            deletedAt: $group->{SettingsGroupInterface::ATTR_DELETED_AT},
        );
    }
}
