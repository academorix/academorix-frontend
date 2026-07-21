<?php

declare(strict_types=1);

namespace Stackra\Settings\Registry;

use Stackra\Settings\Contracts\SettingsRegistryInterface;
use Stackra\Settings\Data\SettingDefinitionData;
use Illuminate\Container\Attributes\Scoped;

/**
 * Concrete implementation of {@see SettingsRegistryInterface}.
 *
 * Stores {@see SettingDefinitionData} DTOs keyed by group name.
 * Hydrated at boot by the settings bootstrapper reading every
 * class carrying `#[AsSetting]` via the shared
 * `Stackra\Foundation\Contracts\DiscoversAttributes` seam.
 *
 * `#[Scoped]` — one instance per request lifecycle under Octane;
 * state resets between requests. The stored definitions are
 * effectively immutable once hydrated, but scoped rather than
 * singleton so tests can rebind cleanly.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[Scoped]
final class SettingsRegistry implements SettingsRegistryInterface
{
    /**
     * Registered setting group definitions keyed by group name.
     *
     * @var array<string, SettingDefinitionData>
     */
    private array $definitions = [];

    /**
     * {@inheritDoc}
     */
    public function register(string $group, SettingDefinitionData $definition): void
    {
        $this->definitions[$group] = $definition;
    }

    /**
     * {@inheritDoc}
     */
    public function get(string $group): ?SettingDefinitionData
    {
        return $this->definitions[$group] ?? null;
    }

    /**
     * {@inheritDoc}
     */
    public function all(): array
    {
        $sorted = $this->definitions;

        uasort(
            $sorted,
            static fn (SettingDefinitionData $a, SettingDefinitionData $b): int => $a->sortOrder <=> $b->sortOrder,
        );

        return $sorted;
    }

    /**
     * {@inheritDoc}
     */
    public function has(string $group): bool
    {
        return isset($this->definitions[$group]);
    }

    /**
     * {@inheritDoc}
     *
     * Sorts fields + visual groups by their own `sortOrder` in
     * each definition's payload so the admin UI renders the
     * schema in a stable order.
     */
    public function getSchema(): array
    {
        $schema = [];

        foreach ($this->all() as $definition) {
            $payload = $definition->toArray();

            usort(
                $payload['fields'],
                static fn (array $a, array $b): int => (int) ($a['sortOrder'] ?? 0) <=> (int) ($b['sortOrder'] ?? 0),
            );

            usort(
                $payload['groups'],
                static fn (array $a, array $b): int => (int) ($a['sortOrder'] ?? 0) <=> (int) ($b['sortOrder'] ?? 0),
            );

            $schema[] = $payload;
        }

        return $schema;
    }
}
