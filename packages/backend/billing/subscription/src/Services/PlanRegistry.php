<?php

declare(strict_types=1);

namespace Stackra\Subscription\Services;

use Stackra\Subscription\Attributes\AsPlanTier;
use Stackra\Subscription\Contracts\Services\PlanRegistryInterface;
use Stackra\Subscription\Enums\PlanTier;
use Illuminate\Container\Attributes\Singleton;

/**
 * In-memory registry of every `#[AsPlanTier]`-declared tier profile.
 *
 * Hydrated at boot by the framework's generic hydration pump via
 * the `#[HydratesFrom(AsPlanTier::class)]` declaration on the
 * interface's `register()` method.
 *
 * Idempotent — re-registering the same tier overwrites the previous
 * entry (last-wins so tests can inject fixtures).
 *
 * `#[Singleton]` because the registry is a pure function of the
 * composer manifest — same output every boot, safely shared across
 * every request under Octane.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[Singleton]
final class PlanRegistry implements PlanRegistryInterface
{
    /**
     * Registered tier key → profile map.
     *
     * @var array<string, array{tier: PlanTier, rank: int, label: string, features: list<string>}>
     */
    private array $tiers = [];

    /**
     * {@inheritDoc}
     */
    public function register(string $className, AsPlanTier $attribute): void
    {
        // The class-string isn't stored — the registry is keyed by
        // the tier value, not by the declaring class. The parameter
        // is present for uniformity with the hydration contract.
        unset($className);

        $this->tiers[$attribute->tier->value] = [
            'tier'     => $attribute->tier,
            'rank'     => $attribute->rank,
            'label'    => $attribute->label,
            'features' => $attribute->features,
        ];
    }

    /**
     * {@inheritDoc}
     */
    public function tiers(): array
    {
        return \array_keys($this->tiers);
    }

    /**
     * {@inheritDoc}
     */
    public function profileFor(string $tier): ?array
    {
        return $this->tiers[$tier] ?? null;
    }

    /**
     * {@inheritDoc}
     */
    public function has(string $tier): bool
    {
        return \array_key_exists($tier, $this->tiers);
    }
}
