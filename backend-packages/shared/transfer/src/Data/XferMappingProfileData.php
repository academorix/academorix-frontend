<?php

declare(strict_types=1);

namespace Academorix\Transfer\Data;

use Academorix\Transfer\Contracts\Data\XferMappingProfileInterface;
use Academorix\Transfer\Models\XferMappingProfile;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see XferMappingProfile}.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class XferMappingProfileData extends Data
{
    /**
     * @param  string                 $id          Prefixed ULID `xmap_<26>`.
     * @param  string                 $entityKey   Entity registry key.
     * @param  string                 $name        Profile display name.
     * @param  array<string, string>  $headerMap   Source header → target column map.
     * @param  bool                   $isShared    Whether the profile is tenant-wide shared.
     * @param  int                    $usedCount   Times the profile has been applied.
     */
    public function __construct(
        public string $id,
        public string $entityKey,
        public string $name,
        public array $headerMap,
        public bool $isShared,
        public int $usedCount,
    ) {
    }

    /**
     * Build the DTO from a model.
     */
    public static function fromModel(XferMappingProfile $profile): self
    {
        return new self(
            id: (string) $profile->getKey(),
            entityKey: (string) $profile->{XferMappingProfileInterface::ATTR_ENTITY_KEY},
            name: (string) $profile->{XferMappingProfileInterface::ATTR_NAME},
            headerMap: (array) $profile->{XferMappingProfileInterface::ATTR_HEADER_MAP},
            isShared: (bool) $profile->{XferMappingProfileInterface::ATTR_IS_SHARED},
            usedCount: (int) $profile->{XferMappingProfileInterface::ATTR_USED_COUNT},
        );
    }
}
