<?php

declare(strict_types=1);

namespace Academorix\Settings\Database\Factories;

use Academorix\Settings\Contracts\Data\SettingsSchemaInterface;
use Academorix\Settings\Enums\SettingType;
use Academorix\Settings\Models\SettingsGroup;
use Academorix\Settings\Models\SettingsSchema;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see SettingsSchema}.
 *
 * @extends Factory<SettingsSchema>
 *
 * @category Settings
 *
 * @since    0.1.0
 */
final class SettingsSchemaFactory extends Factory
{
    /**
     * @var class-string<SettingsSchema>
     */
    protected $model = SettingsSchema::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            SettingsSchemaInterface::ATTR_ID            => SettingsSchemaInterface::ID_PREFIX . '_' . Str::ulid()->toBase32(),
            SettingsSchemaInterface::ATTR_GROUP_ID      => SettingsGroup::factory(),
            SettingsSchemaInterface::ATTR_KEY           => (string) $this->faker->unique()->slug(2),
            SettingsSchemaInterface::ATTR_LABEL         => (string) $this->faker->words(2, true),
            SettingsSchemaInterface::ATTR_DESCRIPTION   => (string) $this->faker->sentence(),
            SettingsSchemaInterface::ATTR_TYPE          => SettingType::String->value,
            SettingsSchemaInterface::ATTR_DEFAULT_VALUE => null,
            SettingsSchemaInterface::ATTR_RULES         => [],
            SettingsSchemaInterface::ATTR_SENSITIVE     => false,
            SettingsSchemaInterface::ATTR_IS_SYSTEM     => false,
            SettingsSchemaInterface::ATTR_SORT_ORDER    => 0,
            SettingsSchemaInterface::ATTR_METADATA      => [],
        ];
    }

    /**
     * Flip `sensitive = true` — the value is redacted on the wire +
     * masked in reads unless the caller carries `settings.view-sensitive`.
     */
    public function sensitive(): static
    {
        return $this->state(fn (): array => [
            SettingsSchemaInterface::ATTR_SENSITIVE => true,
        ]);
    }

    /**
     * Flip `is_system = true` — matches rows hydrated by the boot-time
     * discovery pass.
     */
    public function system(): static
    {
        return $this->state(fn (): array => [
            SettingsSchemaInterface::ATTR_IS_SYSTEM => true,
        ]);
    }
}
