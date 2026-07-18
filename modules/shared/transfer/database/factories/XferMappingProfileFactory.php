<?php

declare(strict_types=1);

namespace Academorix\Transfer\Database\Factories;

use Academorix\Transfer\Contracts\Data\XferMappingProfileInterface;
use Academorix\Transfer\Models\XferMappingProfile;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see XferMappingProfile}.
 *
 * @extends Factory<XferMappingProfile>
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class XferMappingProfileFactory extends Factory
{
    /**
     * @var class-string<XferMappingProfile>
     */
    protected $model = XferMappingProfile::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            XferMappingProfileInterface::ATTR_ID          => 'xmap_' . Str::ulid()->toBase32(),
            XferMappingProfileInterface::ATTR_TENANT_ID   => 'ten_' . Str::ulid()->toBase32(),
            XferMappingProfileInterface::ATTR_ENTITY_KEY  => 'athletes',
            XferMappingProfileInterface::ATTR_NAME        => 'Default mapping',
            XferMappingProfileInterface::ATTR_HEADER_MAP  => [],
            XferMappingProfileInterface::ATTR_START_ROW   => 2,
            XferMappingProfileInterface::ATTR_HEADING_ROW => 1,
            XferMappingProfileInterface::ATTR_IS_DEFAULT  => false,
            XferMappingProfileInterface::ATTR_IS_SHARED   => false,
            XferMappingProfileInterface::ATTR_USED_COUNT  => 0,
        ];
    }
}
