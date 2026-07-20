<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Registry;

use Academorix\FeatureFlags\Attributes\AsFeatureFlag;
use Academorix\FeatureFlags\Contracts\Repositories\FeatureRepositoryInterface;
use Laravel\Pennant\Feature as PennantFeature;
use ReflectionClass;

/**
 * Walk `#[AsFeatureFlag]` classes at boot and populate the registry + Pennant.
 *
 * Two responsibilities per Requirement 2.2-2.5, 14.1-14.2:
 *
 *   1. Populate {@see FeatureFlagRegistry} with a `FeatureDefinition`
 *      per discovered class.
 *   2. Upsert one row per discovered flag into `feature_definitions`
 *      via `FeatureRepositoryInterface::upsertMany()`.
 *   3. Register each flag with Pennant. When the declaring class
 *      exposes `resolve()`, wire that as Pennant's class-based
 *      resolver; otherwise register with a no-op resolver — the
 *      package's own `FeatureResolver` (called through
 *      `PennantFeatureChecker`) is the real decision path.
 *
 * Composer-attribute-collector produces the class list at
 * `composer dump-autoload` time — this class consumes it via
 * `\Composer\InstalledVersions` on `run()`.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
final class FeatureFlagDiscovery
{
    /**
     * @param  FeatureFlagRegistry            $registry    Runtime registry populated here.
     * @param  FeatureRepositoryInterface     $repository  Catalog upsert boundary.
     */
    public function __construct(
        private readonly FeatureFlagRegistry $registry,
        private readonly FeatureRepositoryInterface $repository,
    ) {}

    /**
     * Run discovery over the composer-attribute-collector index.
     *
     * Idempotent — safe to invoke on every `package:discover` run
     * and every application boot. Duplicate class-name registration
     * raises via the registry per Requirement 2.5.
     *
     * @param  iterable<class-string>  $classNames  Discovered class names carrying `#[AsFeatureFlag]`.
     * @return void
     */
    public function run(iterable $classNames): void
    {
        $definitions = [];

        foreach ($classNames as $className) {
            if (! \class_exists($className)) {
                continue;
            }

            $reflection = new ReflectionClass($className);
            $attributes = $reflection->getAttributes(AsFeatureFlag::class);
            if ($attributes === []) {
                continue;
            }

            /** @var AsFeatureFlag $attribute */
            $attribute  = $attributes[0]->newInstance();
            $definition = FeatureDefinition::fromAttribute($attribute, $className);

            $this->registry->register($definition);
            $definitions[] = $definition;

            $this->wirePennantResolver($className, $reflection);
        }

        $this->repository->upsertMany($definitions);
    }

    /**
     * Wire Pennant's class-based resolver when the class exposes `resolve()`.
     *
     * When the class does NOT expose `resolve()`, register the flag
     * with a permissive resolver — the real decision path runs
     * through `PennantFeatureChecker` → the package's own
     * `FeatureResolver`. This keeps back-compat with the old
     * `stackra/laravel-feature-flags` class-based shape
     * (Requirement 14.1).
     *
     * @param  class-string       $className   FQN of the declaring class.
     * @param  ReflectionClass<object>  $reflection  Reflection instance (avoids a second reflection call).
     * @return void
     */
    private function wirePennantResolver(string $className, ReflectionClass $reflection): void
    {
        if ($reflection->hasMethod('resolve')) {
            PennantFeature::define($className);

            return;
        }

        $attributes = $reflection->getAttributes(AsFeatureFlag::class);
        if ($attributes === []) {
            return;
        }

        /** @var AsFeatureFlag $attribute */
        $attribute = $attributes[0]->newInstance();

        // Register under the attribute's `name` with a no-op resolver
        // — Pennant will emit `null` and the package checker takes
        // over via its own layered pipeline.
        PennantFeature::define(
            $attribute->name,
            static fn (): ?bool => null,
        );
    }
}
