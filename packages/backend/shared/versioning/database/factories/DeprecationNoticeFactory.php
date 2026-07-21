<?php

declare(strict_types=1);

namespace Stackra\Versioning\Database\Factories;

use Stackra\Versioning\Contracts\Data\DeprecationNoticeInterface;
use Stackra\Versioning\Enums\DeprecationSurface;
use Stackra\Versioning\Models\ApiVersion;
use Stackra\Versioning\Models\DeprecationNotice;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see DeprecationNotice}.
 *
 * Produces active REST-surface notices by default. Common test
 * variants: `->inactive()`, `->webhook()`, `->all()`.
 *
 * @extends Factory<DeprecationNotice>
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
final class DeprecationNoticeFactory extends Factory
{
    /**
     * @var class-string<DeprecationNotice>
     */
    protected $model = DeprecationNotice::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            DeprecationNoticeInterface::ATTR_ID              => 'dpn_' . Str::ulid()->toBase32(),
            DeprecationNoticeInterface::ATTR_API_VERSION_ID  => ApiVersion::factory(),
            DeprecationNoticeInterface::ATTR_SURFACE         => DeprecationSurface::Rest->value,
            DeprecationNoticeInterface::ATTR_TITLE           => 'Deprecation notice',
            DeprecationNoticeInterface::ATTR_BODY            => 'This version will be sunset. Please migrate.',
            DeprecationNoticeInterface::ATTR_IS_ACTIVE       => true,
            DeprecationNoticeInterface::ATTR_REPLACEMENT_VERSION => null,
        ];
    }

    /**
     * State — inactive notice (draft).
     */
    public function inactive(): static
    {
        return $this->state(fn (): array => [
            DeprecationNoticeInterface::ATTR_IS_ACTIVE => false,
        ]);
    }

    /**
     * State — webhook-surface notice.
     */
    public function webhook(): static
    {
        return $this->state(fn (): array => [
            DeprecationNoticeInterface::ATTR_SURFACE => DeprecationSurface::Webhook->value,
        ]);
    }

    /**
     * State — every-surface notice.
     */
    public function all(): static
    {
        return $this->state(fn (): array => [
            DeprecationNoticeInterface::ATTR_SURFACE => DeprecationSurface::All->value,
        ]);
    }
}
