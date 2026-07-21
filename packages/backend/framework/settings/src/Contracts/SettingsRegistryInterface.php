<?php

declare(strict_types=1);

namespace Stackra\Settings\Contracts;

use Stackra\Settings\Data\SettingDefinitionData;
use Stackra\Settings\Registry\SettingsRegistry;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Container\Attributes\Scoped;

/**
 * Contract for the central settings-definition registry.
 *
 * Hydrated at boot by
 * {@see \Stackra\Settings\Bootstrappers\SettingsBootstrapper}
 * from every class carrying `#[AsSetting]`, then consumed at
 * runtime by the {@see SettingsServiceInterface}, the settings
 * actions, and the schema endpoint.
 *
 * Bound to {@see SettingsRegistry} as a request-scoped singleton
 * via `#[Bind]` + `#[Scoped]` — Octane-safe (state resets per
 * request).
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[Bind(SettingsRegistry::class)]
#[Scoped]
interface SettingsRegistryInterface
{
    /**
     * Register one setting group's resolved definition.
     *
     * @param  string  $group  Unique group key (e.g. `theme`, `notifications`).
     * @param  SettingDefinitionData  $definition  Resolved DTO from the compiler.
     */
    public function register(string $group, SettingDefinitionData $definition): void;

    /**
     * Fetch the definition for a group, or `null` when unregistered.
     */
    public function get(string $group): ?SettingDefinitionData;

    /**
     * Every registered definition, keyed by group and sorted by
     * `sortOrder` ascending.
     *
     * @return array<string, SettingDefinitionData>
     */
    public function all(): array;

    /**
     * Whether a group has been registered.
     */
    public function has(string $group): bool;

    /**
     * Full schema shape for the admin UI, ready for JSON
     * serialisation.
     *
     * @return list<array<string, mixed>>
     */
    public function getSchema(): array;
}
