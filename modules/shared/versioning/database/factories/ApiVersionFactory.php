<?php

declare(strict_types=1);

namespace Academorix\Versioning\Database\Factories;

use Academorix\Versioning\Contracts\Data\ApiVersionInterface;
use Academorix\Versioning\Enums\ApiVersionStatus;
use Academorix\Versioning\Enums\VersionScheme;
use Academorix\Versioning\Models\ApiVersion;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see ApiVersion}.
 *
 * Produces `draft` rows on the default `semver` scheme. Common test
 * variants: `->released()`, `->deprecated()`, `->sunset()`,
 * `->system()`.
 *
 * @extends Factory<ApiVersion>
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
final class ApiVersionFactory extends Factory
{
    /**
     * @var class-string<ApiVersion>
     */
    protected $model = ApiVersion::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        static $counter = 0;
        $counter++;

        return [
            ApiVersionInterface::ATTR_ID           => 'apv_' . Str::ulid()->toBase32(),
            ApiVersionInterface::ATTR_SLUG         => 'v' . $counter,
            ApiVersionInterface::ATTR_SCHEME       => VersionScheme::SemVer->value,
            ApiVersionInterface::ATTR_SCHEME_VALUE => '1.0.0',
            ApiVersionInterface::ATTR_STATUS       => ApiVersionStatus::Draft->value,
            ApiVersionInterface::ATTR_DESCRIPTION  => null,
            ApiVersionInterface::ATTR_IS_SYSTEM    => false,
        ];
    }

    /**
     * State — released version.
     */
    public function released(): static
    {
        return $this->state(fn (): array => [
            ApiVersionInterface::ATTR_STATUS      => ApiVersionStatus::Released->value,
            ApiVersionInterface::ATTR_RELEASED_AT => \Carbon\CarbonImmutable::now(),
        ]);
    }

    /**
     * State — deprecated version with sunset scheduled.
     */
    public function deprecated(): static
    {
        return $this->state(fn (): array => [
            ApiVersionInterface::ATTR_STATUS        => ApiVersionStatus::Deprecated->value,
            ApiVersionInterface::ATTR_RELEASED_AT   => \Carbon\CarbonImmutable::now()->subYear(),
            ApiVersionInterface::ATTR_DEPRECATED_AT => \Carbon\CarbonImmutable::now(),
            ApiVersionInterface::ATTR_SUNSET_AT     => \Carbon\CarbonImmutable::now()->addDays(180),
        ]);
    }

    /**
     * State — sunset version.
     */
    public function sunset(): static
    {
        return $this->state(fn (): array => [
            ApiVersionInterface::ATTR_STATUS        => ApiVersionStatus::Sunset->value,
            ApiVersionInterface::ATTR_RELEASED_AT   => \Carbon\CarbonImmutable::now()->subYears(2),
            ApiVersionInterface::ATTR_DEPRECATED_AT => \Carbon\CarbonImmutable::now()->subYear(),
            ApiVersionInterface::ATTR_SUNSET_AT     => \Carbon\CarbonImmutable::now()->subDays(1),
        ]);
    }

    /**
     * State — system-owned row.
     */
    public function system(): static
    {
        return $this->state(fn (): array => [
            ApiVersionInterface::ATTR_IS_SYSTEM => true,
        ]);
    }
}
