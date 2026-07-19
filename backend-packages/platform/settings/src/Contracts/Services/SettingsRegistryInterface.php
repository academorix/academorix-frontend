<?php

declare(strict_types=1);

namespace Academorix\Settings\Contracts\Services;

use Academorix\Settings\Services\SettingsRegistry;
use Illuminate\Container\Attributes\Bind;

/**
 * In-memory registry of discovered settings groups + fields.
 *
 * Populated at boot by
 * {@see \Academorix\Settings\Bootstrappers\SettingsDiscoveryBootstrapper}
 * — every `#[AsSetting]` class contributes exactly one group and its
 * `#[SettingField]` properties become the group's fields. Consumers
 * (the resolver, the writer, the admin UI schema endpoint) read the
 * registry to avoid a DB roundtrip on every request.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[Bind(SettingsRegistry::class)]
interface SettingsRegistryInterface
{
    /**
     * Register a group + its fields.
     *
     * @param  string                                 $groupKey   Group slug.
     * @param  array<string, mixed>                   $groupMeta  Label / description / icon / permission / scope / public / sortOrder.
     * @param  array<int, array<string, mixed>>       $fields     One entry per declared `#[SettingField]`.
     *
     * @throws \RuntimeException  When `$groupKey` is already registered and the
     *                            `settings.discovery.fail_on_duplicate_group` flag is on.
     */
    public function register(string $groupKey, array $groupMeta, array $fields): void;

    /**
     * Every registered group's metadata.
     *
     * @return array<string, array<string, mixed>>  Group slug → metadata.
     */
    public function groups(): array;

    /**
     * Every field registered against a group.
     *
     * @param  string  $groupKey  Group slug.
     * @return array<int, array<string, mixed>>  Field entries; empty when the group is unknown.
     */
    public function fields(string $groupKey): array;
}
