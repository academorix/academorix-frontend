<?php

declare(strict_types=1);

namespace Stackra\Storage\Database\Factories;

use Stackra\Storage\Contracts\Data\FileVariantInterface;
use Stackra\Storage\Models\FileVariant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see FileVariant}.
 *
 * @extends Factory<FileVariant>
 *
 * @category Storage
 *
 * @since    0.1.0
 */
final class FileVariantFactory extends Factory
{
    /**
     * @var class-string<FileVariant>
     */
    protected $model = FileVariant::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            FileVariantInterface::ATTR_ID                      => 'fvr_' . Str::ulid()->toBase32(),
            FileVariantInterface::ATTR_FILE_ID                 => 'fil_' . Str::ulid()->toBase32(),
            FileVariantInterface::ATTR_TENANT_ID               => 'ten_' . Str::ulid()->toBase32(),
            FileVariantInterface::ATTR_VARIANT_KEY             => 'thumbnail',
            FileVariantInterface::ATTR_GENERATED_BY_CONVERSION => 'Stackra\\Storage\\Variants\\ThumbnailRecipe',
            FileVariantInterface::ATTR_MIME_TYPE               => 'image/webp',
            FileVariantInterface::ATTR_WIDTH                   => 200,
            FileVariantInterface::ATTR_HEIGHT                  => 200,
            FileVariantInterface::ATTR_SIZE_BYTES              => \random_int(1_000, 50_000),
            FileVariantInterface::ATTR_DISK                    => 'local',
            FileVariantInterface::ATTR_PATH                    => 'tenants/tenant/variants/thumbnail/' . Str::random(64) . '.webp',
            FileVariantInterface::ATTR_GENERATED_AT            => \Carbon\CarbonImmutable::now(),
        ];
    }
}
