<?php

declare(strict_types=1);

namespace Stackra\Compliance\Database\Factories;

use Stackra\Compliance\Contracts\Data\DsarArtefactInterface;
use Stackra\Compliance\Models\DsarArtefact;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see DsarArtefact}.
 *
 * @extends Factory<DsarArtefact>
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
final class DsarArtefactFactory extends Factory
{
    /**
     * @var class-string<DsarArtefact>
     */
    protected $model = DsarArtefact::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            DsarArtefactInterface::ATTR_ID         => 'dsa_' . Str::ulid()->toBase32(),
            DsarArtefactInterface::ATTR_TENANT_ID  => 'ten_' . Str::ulid()->toBase32(),
            DsarArtefactInterface::ATTR_DSAR_ID    => 'dsr_' . Str::ulid()->toBase32(),
            DsarArtefactInterface::ATTR_MODULE     => 'user',
            DsarArtefactInterface::ATTR_ENTITY     => 'App\\Models\\User',
            DsarArtefactInterface::ATTR_ROW_COUNT  => 1,
            DsarArtefactInterface::ATTR_FORMAT     => 'json',
            DsarArtefactInterface::ATTR_STATUS     => 'pending',
        ];
    }
}
