<?php

declare(strict_types=1);

namespace Academorix\Subscription\Contracts\Services;

use Academorix\ServiceProvider\Attributes\HydratesFrom;
use Academorix\Subscription\Attributes\AsPlanTier;
use Academorix\Subscription\Enums\PlanTier;
use Academorix\Subscription\Services\PlanRegistry;
use Illuminate\Container\Attributes\Bind;

/**
 * In-memory registry of every `#[AsPlanTier]`-declared tier profile.
 *
 * Hydrated at boot by the framework's generic
 * {@see \Academorix\ServiceProvider\Bootstrappers\HydrationBootstrapper}
 * pump via the {@see HydratesFrom} attribute on {@see register()}.
 * Consumers of the registry read the shipped defaults (label, rank,
 * bundled features) when provisioning a plan or comparing tiers.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[Bind(PlanRegistry::class)]
interface PlanRegistryInterface
{
    /**
     * Register a tier profile.
     *
     * `#[HydratesFrom(AsPlanTier::class)]` — the framework scans every
     * class carrying `#[AsPlanTier]` at boot and calls this method
     * with `(className, attributeInstance)`. The concrete registry
     * decides what to store; the interface only enforces the shape.
     *
     * @param  class-string  $className  FQCN of the declaring class.
     * @param  AsPlanTier    $attribute  The discovered attribute instance.
     */
    #[HydratesFrom(AsPlanTier::class)]
    public function register(string $className, AsPlanTier $attribute): void;

    /**
     * Every registered tier key.
     *
     * @return list<string>
     */
    public function tiers(): array;

    /**
     * The tier profile for one key. Returns null when the key was
     * never registered.
     *
     * @return array{tier: PlanTier, rank: int, label: string, features: list<string>}|null
     */
    public function profileFor(string $tier): ?array;

    /**
     * Whether a tier key was registered.
     */
    public function has(string $tier): bool;
}
