<?php

declare(strict_types=1);

namespace Academorix\Settings\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;
use Academorix\Settings\Contracts\Data\SettingsGroupInterface;
use Academorix\Settings\Contracts\Data\SettingsSchemaInterface;
use Academorix\Settings\Contracts\Data\SettingValueInterface;
use Academorix\Settings\Contracts\Repositories\SettingsGroupRepositoryInterface;
use Academorix\Settings\Contracts\Repositories\SettingsSchemaRepositoryInterface;
use Academorix\Settings\Contracts\Services\SettingsRegistryInterface;
use Academorix\Settings\Enums\SettingScopeKind;
use Academorix\Settings\Models\SettingsGroup;
use Academorix\Settings\Models\SettingsSchema;
use Academorix\Settings\Models\SettingValue;

/**
 * `php artisan settings:seed` — seed system-scope defaults for every
 * registered `#[SettingField]`.
 *
 * Idempotent — reruns updates rows in place. Never emits
 * `SettingsChangeEvent`s (system-scope seeding is not a user-visible
 * change) — the audit trail is the discovery log itself.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'settings:seed',
    description: 'Seed system-scope defaults from the discovered registry.',
)]
final class SettingsSeedCommand extends BaseCommand
{
    public function handle(
        SettingsRegistryInterface $registry,
        SettingsGroupRepositoryInterface $groups,
        SettingsSchemaRepositoryInterface $schemas,
    ): int {
        $this->omni->titleBar('Seed System Settings', 'emerald');

        $groupCount  = 0;
        $schemaCount = 0;
        $valueCount  = 0;

        foreach ($registry->groups() as $groupKey => $meta) {
            $group = $groups->findByKey((string) $groupKey);

            if ($group === null) {
                $group = SettingsGroup::query()->create([
                    SettingsGroupInterface::ATTR_KEY         => $groupKey,
                    SettingsGroupInterface::ATTR_NAME        => (string) ($meta['label'] ?? $groupKey),
                    SettingsGroupInterface::ATTR_DESCRIPTION => (string) ($meta['description'] ?? ''),
                    SettingsGroupInterface::ATTR_ICON        => (string) ($meta['icon'] ?? ''),
                    SettingsGroupInterface::ATTR_SORT_ORDER  => (int) ($meta['sort_order'] ?? 0),
                    SettingsGroupInterface::ATTR_IS_SYSTEM   => true,
                ]);
                $groupCount++;
            }

            foreach ($registry->fields((string) $groupKey) as $field) {
                $schema = $schemas->findByGroupAndKey((string) $groupKey, (string) ($field['key'] ?? ''));

                if ($schema === null) {
                    $schema = SettingsSchema::query()->create([
                        SettingsSchemaInterface::ATTR_GROUP_ID      => $group->getKey(),
                        SettingsSchemaInterface::ATTR_KEY           => (string) ($field['key'] ?? ''),
                        SettingsSchemaInterface::ATTR_LABEL         => (string) ($field['label'] ?? ''),
                        SettingsSchemaInterface::ATTR_DESCRIPTION   => (string) ($field['description'] ?? ''),
                        SettingsSchemaInterface::ATTR_TYPE          => (string) ($field['type'] ?? 'string'),
                        SettingsSchemaInterface::ATTR_DEFAULT_VALUE => $field['default'] ?? null,
                        SettingsSchemaInterface::ATTR_RULES         => (array) ($field['rules'] ?? []),
                        SettingsSchemaInterface::ATTR_SENSITIVE     => (bool) ($field['sensitive'] ?? false),
                        SettingsSchemaInterface::ATTR_IS_SYSTEM     => true,
                        SettingsSchemaInterface::ATTR_SORT_ORDER    => (int) ($field['sort_order'] ?? 0),
                    ]);
                    $schemaCount++;
                }

                // Seed the system-scope value row.
                $default = $field['default'] ?? null;
                if ($default === null) {
                    continue;
                }

                $exists = SettingValue::query()
                    ->where(SettingValueInterface::ATTR_SCHEMA_ID, $schema->getKey())
                    ->where(SettingValueInterface::ATTR_SCOPE_KIND, SettingScopeKind::System->value)
                    ->whereNull(SettingValueInterface::ATTR_SCOPE_ID)
                    ->exists();

                if (! $exists) {
                    SettingValue::query()->create([
                        SettingValueInterface::ATTR_SCHEMA_ID  => $schema->getKey(),
                        SettingValueInterface::ATTR_SCOPE_KIND => SettingScopeKind::System->value,
                        SettingValueInterface::ATTR_SCOPE_ID   => null,
                        SettingValueInterface::ATTR_VALUE      => $default,
                    ]);
                    $valueCount++;
                }
            }
        }

        $this->omni->tableHeader('Kind', 'Created');
        $this->omni->tableRow('Groups', (string) $groupCount);
        $this->omni->tableRow('Schemas', (string) $schemaCount);
        $this->omni->tableRow('System values', (string) $valueCount);

        $this->omni->success('System settings seeded.');
        $this->showDuration();

        return self::SUCCESS;
    }
}
