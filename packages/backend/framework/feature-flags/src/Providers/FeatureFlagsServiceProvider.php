<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Providers;

use Academorix\FeatureFlags\Registry\FeatureFlagDiscovery;
use Academorix\ServiceProvider\Attributes\LoadsResources;
use Academorix\ServiceProvider\Attributes\Module;
use Academorix\ServiceProvider\Attributes\OnBoot;
use Academorix\ServiceProvider\Providers\ServiceProvider;

/**
 * Feature-flags module provider — attribute-first, zero manual bindings.
 *
 * Module priority `90` — boots after tenancy (30), scope (20),
 * routing (2), and auth, and before consumer modules that
 * evaluate flags at boot. Every binding is expressed via
 * `#[Bind]` on the interface (see `FeatureCheckerInterface`,
 * `FeatureFlagRegistry`, and the four repository interfaces);
 * this provider carries no `bindings()` method by design (ADR 0006).
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[Module(name: 'FeatureFlags', priority: 90)]
#[LoadsResources(
    migrations: true,
    config: true,
    commands: true,
    publishables: true,
)]
final class FeatureFlagsServiceProvider extends ServiceProvider
{
    /**
     * Run `#[AsFeatureFlag]` discovery once at boot.
     *
     * Idempotent — the composer-attribute-collector index is
     * static per deploy. Skipped when the collector is not
     * available (fresh install pre-`composer dump-autoload`).
     *
     * @param  FeatureFlagDiscovery  $discovery  Discovery service.
     * @return void
     */
    #[OnBoot(priority: 20)]
    protected function runFlagDiscovery(FeatureFlagDiscovery $discovery): void
    {
        $collectorClass = '\\Composer\\Attribute\\Collection';
        if (! \class_exists($collectorClass)) {
            return;
        }

        /** @var iterable<object{ name: class-string, attribute: object }> $targets */
        $targets = $collectorClass::findTargetClasses(
            \Academorix\FeatureFlags\Attributes\AsFeatureFlag::class,
        );

        $classNames = [];
        foreach ($targets as $target) {
            $classNames[] = $target->name;
        }

        $discovery->run($classNames);
    }
}
