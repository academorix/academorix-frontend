<?php

declare(strict_types=1);

namespace Stackra\Application\Database\Factories;

use Stackra\Application\Contracts\Data\ApplicationInterface;
use Stackra\Application\Enums\BusinessTypeEnum;
use Stackra\Application\Models\Application;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see Application}.
 *
 * Produces non-default, non-system rows by default. States:
 * `->asDefault()` flips `is_default` on; `->asSystem()` flips
 * `is_system` on (only meaningful inside a seeder / test that
 * routes through `Application::allowSystemMutation()` if system-row
 * observer guards are extended later).
 *
 * @extends Factory<Application>
 *
 * @category Application
 *
 * @since    0.1.0
 */
final class ApplicationFactory extends Factory
{
    /**
     * The model this factory builds.
     *
     * @var class-string<Application>
     */
    protected $model = Application::class;

    /**
     * Default model attribute values.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $slug = 'app-'.Str::random(8);

        return [
            ApplicationInterface::ATTR_ID                    => 'app_'.Str::ulid()->toBase32(),
            ApplicationInterface::ATTR_SLUG                  => $slug,
            ApplicationInterface::ATTR_NAME                  => 'Application '.Str::title($slug),
            ApplicationInterface::ATTR_DESCRIPTION           => $this->faker->sentence(),
            ApplicationInterface::ATTR_DEFAULT_BUSINESS_TYPE => BusinessTypeEnum::SportsCenter->value,
            ApplicationInterface::ATTR_DEFAULT_LOCALE        => 'en',
            ApplicationInterface::ATTR_DEFAULT_TIMEZONE      => 'UTC',
            ApplicationInterface::ATTR_DEFAULT_CURRENCY      => 'USD',
            ApplicationInterface::ATTR_CENTRAL_HOST          => $slug.'.stackra.app',
            ApplicationInterface::ATTR_PLATFORM_ADMIN_HOST   => 'admin.'.$slug.'.stackra.app',
            ApplicationInterface::ATTR_CONFIG                => [],
            ApplicationInterface::ATTR_IS_DEFAULT            => false,
            ApplicationInterface::ATTR_IS_SYSTEM             => false,
        ];
    }

    /**
     * State — the default fallback row for unmatched hosts.
     */
    public function asDefault(): static
    {
        return $this->state(fn () => [
            ApplicationInterface::ATTR_IS_DEFAULT => true,
        ]);
    }

    /**
     * State — a platform-seeded system row.
     */
    public function asSystem(): static
    {
        return $this->state(fn () => [
            ApplicationInterface::ATTR_IS_SYSTEM => true,
        ]);
    }

    /**
     * State — the canonical "Stackra" default row (used by tests + seeders).
     */
    public function stackra(): static
    {
        return $this->state(fn () => [
            ApplicationInterface::ATTR_SLUG                => 'stackra',
            ApplicationInterface::ATTR_NAME                => 'Stackra',
            ApplicationInterface::ATTR_CENTRAL_HOST        => 'stackra.app',
            ApplicationInterface::ATTR_PLATFORM_ADMIN_HOST => 'admin.stackra.app',
            ApplicationInterface::ATTR_IS_DEFAULT          => true,
        ]);
    }
}
