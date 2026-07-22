<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Registry;

use Stackra\Entitlements\Attributes\ConsumesEntitlement;
use Stackra\Entitlements\Contracts\Registry\EntitlementRegistryInterface;
use Stackra\Entitlements\Enums\EntitlementKind;
use Stackra\Entitlements\Enums\EntitlementPeriod;
use Illuminate\Container\Attributes\Singleton;

/**
 * In-memory registry of every `#[ConsumesEntitlement]`-declared key.
 *
 * Hydrated at boot by the framework's generic hydration pump
 * ({@see \Stackra\ServiceProvider\Bootstrappers\HydrationBootstrapper})
 * via the `#[HydratesFrom]` declaration on
 * {@see EntitlementRegistryInterface::register()}.
 *
 * Idempotent — re-registering the same key overwrites the previous
 * entry (documented behaviour: last-wins so tests can inject
 * fixtures).
 *
 * `#[Singleton]` because the registry is a pure function of the
 * composer manifest — same output every boot, safely shared across
 * every request under Octane.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[Singleton]
final class EntitlementRegistry implements EntitlementRegistryInterface
{
    /**
     * Registered key → shape map.
     *
     * @var array<string, array{kind: EntitlementKind, value: array<string, mixed>, period: EntitlementPeriod|null}>
     */
    private array $keys = [];

    /**
     * {@inheritDoc}
     */
    public function register(string $className, ConsumesEntitlement $attribute): void
    {
        // The class-string isn't stored — the registry is keyed by
        // the entitlement key, not by the consuming class. The
        // parameter is present for uniformity with the hydration
        // contract (framework calls every #[HydratesFrom]-marked
        // method as `(className, attributeInstance)`).
        unset($className);

        $kind = $attribute->kind;
        $period = $attribute->period;

        // Pool kinds require a period; non-pool kinds carry a null.
        // Force a sane default rather than persist an invalid tuple.
        if ($kind === EntitlementKind::Pool && $period === null) {
            $period = EntitlementPeriod::Monthly;
        }

        $this->keys[$attribute->key] = [
            'kind'   => $kind,
            'value'  => $attribute->defaultValue,
            'period' => $kind === EntitlementKind::Pool ? $period : null,
        ];
    }

    /**
     * {@inheritDoc}
     */
    public function keys(): array
    {
        return \array_keys($this->keys);
    }

    /**
     * {@inheritDoc}
     */
    public function defaultsFor(string $key): ?array
    {
        return $this->keys[$key] ?? null;
    }

    /**
     * {@inheritDoc}
     */
    public function has(string $key): bool
    {
        return \array_key_exists($key, $this->keys);
    }
}
