<?php

declare(strict_types=1);

namespace Academorix\Settings\Services;

use Academorix\Settings\Contracts\Services\SettingsRegistryInterface;
use Illuminate\Container\Attributes\Singleton;

/**
 * In-memory registry of `#[AsSetting]` groups + fields.
 *
 * `#[Singleton]` — the registry is populated once at boot by
 * {@see \Academorix\Settings\Bootstrappers\SettingsDiscoveryBootstrapper}
 * and read many times per request; state is immutable after
 * construction so it is safe across Octane workers.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[Singleton]
final class SettingsRegistry implements SettingsRegistryInterface
{
    /**
     * Group metadata, keyed by group slug.
     *
     * @var array<string, array<string, mixed>>
     */
    private array $groups = [];

    /**
     * Field entries, keyed by group slug.
     *
     * @var array<string, array<int, array<string, mixed>>>
     */
    private array $fields = [];

    /**
     * {@inheritDoc}
     */
    public function register(string $groupKey, array $groupMeta, array $fields): void
    {
        if (\array_key_exists($groupKey, $this->groups)) {
            $strict = (bool) \config('settings.discovery.fail_on_duplicate_group', true);
            if ($strict) {
                throw new \RuntimeException(\sprintf(
                    'Settings group "%s" is already registered — two classes declared #[AsSetting] with the same key.',
                    $groupKey,
                ));
            }
        }

        $this->groups[$groupKey] = $groupMeta;
        $this->fields[$groupKey] = $fields;
    }

    /**
     * {@inheritDoc}
     */
    public function groups(): array
    {
        return $this->groups;
    }

    /**
     * {@inheritDoc}
     */
    public function fields(string $groupKey): array
    {
        return $this->fields[$groupKey] ?? [];
    }
}
