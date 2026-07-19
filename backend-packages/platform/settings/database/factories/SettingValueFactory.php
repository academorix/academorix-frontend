<?php

declare(strict_types=1);

namespace Academorix\Settings\Database\Factories;

use Academorix\Settings\Contracts\Data\SettingValueInterface;
use Academorix\Settings\Enums\SettingScopeKind;
use Academorix\Settings\Models\SettingsSchema;
use Academorix\Settings\Models\SettingValue;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see SettingValue}.
 *
 * @extends Factory<SettingValue>
 *
 * @category Settings
 *
 * @since    0.1.0
 */
final class SettingValueFactory extends Factory
{
    /**
     * @var class-string<SettingValue>
     */
    protected $model = SettingValue::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            SettingValueInterface::ATTR_ID         => SettingValueInterface::ID_PREFIX . '_' . Str::ulid()->toBase32(),
            SettingValueInterface::ATTR_SCHEMA_ID  => SettingsSchema::factory(),
            SettingValueInterface::ATTR_SCOPE_KIND => SettingScopeKind::System->value,
            SettingValueInterface::ATTR_SCOPE_ID   => null,
            SettingValueInterface::ATTR_TENANT_ID  => null,
            SettingValueInterface::ATTR_VALUE      => 'value',
            SettingValueInterface::ATTR_METADATA   => [],
        ];
    }

    /**
     * Tenant-scope row. The caller must supply a tenant id.
     */
    public function forTenant(string $tenantId): static
    {
        return $this->state(fn (): array => [
            SettingValueInterface::ATTR_SCOPE_KIND => SettingScopeKind::Tenant->value,
            SettingValueInterface::ATTR_SCOPE_ID   => $tenantId,
            SettingValueInterface::ATTR_TENANT_ID  => $tenantId,
        ]);
    }

    /**
     * User-scope row. The caller must supply user + tenant ids.
     */
    public function forUser(string $userId, ?string $tenantId = null): static
    {
        return $this->state(fn (): array => [
            SettingValueInterface::ATTR_SCOPE_KIND => SettingScopeKind::User->value,
            SettingValueInterface::ATTR_SCOPE_ID   => $userId,
            SettingValueInterface::ATTR_TENANT_ID  => $tenantId,
        ]);
    }
}
