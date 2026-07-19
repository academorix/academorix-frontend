<?php

declare(strict_types=1);

namespace Academorix\Settings\Services;

use Academorix\Settings\Contracts\Data\SettingValueInterface;
use Academorix\Settings\Contracts\Repositories\SettingValueRepositoryInterface;
use Academorix\Settings\Contracts\Services\SettingsRegistryInterface;
use Academorix\Settings\Contracts\Services\SettingsResolverInterface;
use Academorix\Settings\Enums\SettingScopeKind;
use Illuminate\Container\Attributes\Scoped;

/**
 * Default hierarchy resolver.
 *
 * Walks the cascade deepest-first — user → tenant → system — and
 * falls back to the field's declared default when no override row
 * exists in any layer. `#[Scoped]` — one instance per request; safe
 * to memoise per-request lookups internally in a future revision.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[Scoped]
final class DefaultSettingsResolver implements SettingsResolverInterface
{
    public function __construct(
        private readonly SettingValueRepositoryInterface $values,
        private readonly SettingsRegistryInterface $registry,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function resolve(string $key, ?string $tenantId, ?string $userId): mixed
    {
        // 1. User scope (deepest).
        if ($userId !== null) {
            $row = $this->values->resolve($key, SettingScopeKind::User->value, $userId);
            if ($row !== null) {
                return $row->{SettingValueInterface::ATTR_VALUE};
            }
        }

        // 2. Tenant scope.
        if ($tenantId !== null) {
            $row = $this->values->resolve($key, SettingScopeKind::Tenant->value, $tenantId);
            if ($row !== null) {
                return $row->{SettingValueInterface::ATTR_VALUE};
            }
        }

        // 3. System scope (platform default seeded row).
        $row = $this->values->resolve($key, SettingScopeKind::System->value, null);
        if ($row !== null) {
            return $row->{SettingValueInterface::ATTR_VALUE};
        }

        // 4. Registry-level default (no seeded row).
        return $this->fieldDefault($key);
    }

    /**
     * Locate the field's declared default across every registered group.
     */
    private function fieldDefault(string $key): mixed
    {
        foreach ($this->registry->groups() as $groupKey => $_meta) {
            foreach ($this->registry->fields($groupKey) as $field) {
                if (($field['key'] ?? null) === $key) {
                    return $field['default'] ?? null;
                }
            }
        }

        return null;
    }
}
