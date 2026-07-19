<?php

declare(strict_types=1);

namespace Academorix\Settings\Services;

use Academorix\Settings\Contracts\Data\SettingsSchemaInterface;
use Academorix\Settings\Contracts\Data\SettingValueInterface;
use Academorix\Settings\Contracts\Repositories\SettingsSchemaRepositoryInterface;
use Academorix\Settings\Contracts\Repositories\SettingValueRepositoryInterface;
use Academorix\Settings\Contracts\Services\SettingsRegistryInterface;
use Academorix\Settings\Contracts\Services\SettingsWriterInterface;
use Academorix\Settings\Events\SettingsChangeEvent;
use Academorix\Settings\Events\SettingsWriteRefused;
use Academorix\Settings\Exceptions\SettingNotFoundException;
use Academorix\Settings\Exceptions\SettingsWriteRefusedException;
use Academorix\Settings\Models\SettingValue;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Support\Facades\DB;

/**
 * Default write orchestrator.
 *
 * Persists a value at a specific scope, dispatches
 * {@see SettingsChangeEvent} on commit (activity + audit consume), and
 * fires {@see SettingsWriteRefused} on refusals so ops can observe
 * misuse.
 *
 * `#[Scoped]` — one instance per request; internal state (the current
 * user id, correlation id) belongs to the request scope.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[Scoped]
final class DefaultSettingsWriter implements SettingsWriterInterface
{
    public function __construct(
        private readonly SettingValueRepositoryInterface $values,
        private readonly SettingsSchemaRepositoryInterface $schemas,
        private readonly SettingsRegistryInterface $registry,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function write(string $key, mixed $value, string $scopeKind, ?string $scopeId): SettingValue
    {
        $schema = $this->locateSchema($key);
        if ($schema === null) {
            throw new SettingNotFoundException(\sprintf(
                'Cannot write setting "%s" — no matching schema is registered.',
                $key,
            ));
        }

        $isSensitive = (bool) $schema->{SettingsSchemaInterface::ATTR_SENSITIVE};

        try {
            /** @var SettingValue $row */
            $row = DB::transaction(function () use ($schema, $value, $scopeKind, $scopeId): SettingValue {
                $existing = $this->values->resolve(
                    (string) $schema->{SettingsSchemaInterface::ATTR_KEY},
                    $scopeKind,
                    $scopeId,
                );

                $attributes = [
                    SettingValueInterface::ATTR_SCHEMA_ID  => (string) $schema->getKey(),
                    SettingValueInterface::ATTR_SCOPE_KIND => $scopeKind,
                    SettingValueInterface::ATTR_SCOPE_ID   => $scopeId,
                    SettingValueInterface::ATTR_VALUE      => $value,
                ];

                if ($existing === null) {
                    return SettingValue::query()->create($attributes);
                }

                $existing->update([SettingValueInterface::ATTR_VALUE => $value]);

                return $existing->refresh();
            });
        } catch (\Throwable $t) {
            SettingsWriteRefused::dispatch($key, 'validation_failed', $scopeKind);

            throw SettingsWriteRefusedException::for($key, 'validation_failed');
        }

        SettingsChangeEvent::dispatch(
            $key,
            null, // `before` — populated by the audit listener from the audit trail on demand.
            $isSensitive ? null : $value,
            $scopeKind,
            $scopeId,
            null,
            $isSensitive,
        );

        return $row;
    }

    /**
     * Find the schema row backing a key. Falls back to a registry
     * lookup + on-the-fly DB read when the schema hasn't been seeded
     * yet (early-boot writes).
     */
    private function locateSchema(string $key): ?\Academorix\Settings\Models\SettingsSchema
    {
        foreach ($this->registry->groups() as $groupKey => $_meta) {
            foreach ($this->registry->fields($groupKey) as $field) {
                if (($field['key'] ?? null) !== $key) {
                    continue;
                }

                $schema = $this->schemas->findByGroupAndKey($groupKey, $key);
                if ($schema !== null) {
                    return $schema;
                }
            }
        }

        return null;
    }
}
