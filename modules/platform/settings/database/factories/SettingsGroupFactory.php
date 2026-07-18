<?php

declare(strict_types=1);

namespace Academorix\Settings\Database\Factories;

use Academorix\Settings\Contracts\Data\SettingsGroupInterface;
use Academorix\Settings\Models\SettingsGroup;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see SettingsGroup}.
 *
 * @extends Factory<SettingsGroup>
 *
 * @category Settings
 *
 * @since    0.1.0
 */
final class SettingsGroupFactory extends Factory
{
    /**
     * @var class-string<SettingsGroup>
     */
    protected $model = SettingsGroup::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            SettingsGroupInterface::ATTR_ID          => SettingsGroupInterface::ID_PREFIX . '_' . Str::ulid()->toBase32(),
            SettingsGroupInterface::ATTR_KEY         => (string) $this->faker->unique()->slug(2),
            SettingsGroupInterface::ATTR_NAME        => (string) $this->faker->words(2, true),
            SettingsGroupInterface::ATTR_DESCRIPTION => (string) $this->faker->sentence(),
            SettingsGroupInterface::ATTR_ICON        => 'cog',
            SettingsGroupInterface::ATTR_SORT_ORDER  => 0,
            SettingsGroupInterface::ATTR_IS_SYSTEM   => false,
            SettingsGroupInterface::ATTR_METADATA    => [],
        ];
    }

    /**
     * Flip `is_system = true` — matches rows hydrated by the boot-time
     * discovery pass.
     */
    public function system(): static
    {
        return $this->state(fn (): array => [
            SettingsGroupInterface::ATTR_IS_SYSTEM => true,
        ]);
    }
}
