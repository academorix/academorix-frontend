<?php

declare(strict_types=1);

namespace Academorix\Transfer\Database\Factories;

use Academorix\Transfer\Contracts\Data\XferArtifactInterface;
use Academorix\Transfer\Enums\XferArtifactKind;
use Academorix\Transfer\Models\XferArtifact;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see XferArtifact}.
 *
 * @extends Factory<XferArtifact>
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class XferArtifactFactory extends Factory
{
    /**
     * @var class-string<XferArtifact>
     */
    protected $model = XferArtifact::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            XferArtifactInterface::ATTR_ID       => 'xart_' . Str::ulid()->toBase32(),
            XferArtifactInterface::ATTR_KIND     => XferArtifactKind::Result->value,
            XferArtifactInterface::ATTR_DISK     => 'local',
            XferArtifactInterface::ATTR_FILENAME => 'result.xlsx',
            XferArtifactInterface::ATTR_SIZE_BYTES => 0,
        ];
    }
}
