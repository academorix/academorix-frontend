<?php

declare(strict_types=1);

/**
 * @file packages/crud/src/Concerns/Discovery/HasDiscoverableCriteria.php
 *
 * @description
 * Trait that adds `#[AsCriteria]` discovery to a service provider (or
 * any host with access to the service container). Resolves the unified
 * {@see \Stackra\Foundation\Contracts\DiscoversAttributes} contract
 * — no direct dependency on the underlying attribute-manifest backend
 * (currently `olvlvl/composer-attribute-collector`, wrapped by
 * {@see \Stackra\Foundation\Discovery\AttributeDiscovery}).
 *
 * ## Boot-time contract
 *
 * Host classes (typically `CrudServiceProvider`) call
 * {@see discoverCriteria()} once from `boot()`. The discovery pass is
 * O(hits) against a pre-compiled static manifest — no filesystem walk,
 * no per-request reflection, Octane-safe.
 *
 * ## Failure isolation
 *
 * A single misconfigured criterion (missing interface, unresolvable
 * constructor, etc.) MUST NOT prevent the rest of the discovery pass
 * from running. Each hit is wrapped in its own try/catch so one broken
 * criterion is logged and skipped.
 *
 * @category Concerns
 *
 * @since 2.0.0
 */

namespace Stackra\Crud\Concerns\Discovery;

use Stackra\Crud\Attributes\AsCriteria;
use Stackra\Crud\Contracts\CriteriaInterface;
use Stackra\Crud\Registry\CriteriaRegistry;
use Stackra\Foundation\Contracts\DiscoversAttributes;
use Throwable;

/**
 * Discovers and registers criteria classes annotated with
 * `#[AsCriteria]`.
 *
 * @since 2.0.0
 */
trait HasDiscoverableCriteria
{
    /**
     * Discover every class carrying `#[AsCriteria]` and register it
     * with the {@see CriteriaRegistry}.
     *
     * The underlying {@see DiscoversAttributes} implementation gracefully
     * returns an empty iterable when the composer-attribute manifest
     * has not been written yet (fresh clone before any `composer dump`,
     * slim test harness without the plugin, etc.), so no defensive
     * `class_exists()` guard is required here.
     *
     * @return int Number of criteria successfully registered.
     */
    protected function discoverCriteria(): int
    {
        /** @var DiscoversAttributes $discovery */
        $discovery = resolve(DiscoversAttributes::class);

        /** @var CriteriaRegistry $registry */
        $registry = resolve(CriteriaRegistry::class);

        $discovered = 0;

        foreach ($discovery->forClass(AsCriteria::class) as $target) {
            $className = $target->className;

            /** @var AsCriteria $attribute */
            $attribute = $target->attribute;

            try {
                // A class carrying `#[AsCriteria]` that doesn't implement
                // the criteria contract is a programmer error, but we
                // skip silently — the architecture linter will surface it.
                if (! is_subclass_of($className, CriteriaInterface::class)) {
                    continue;
                }

                $registry->register(
                    name: $attribute->name,
                    class: $className,
                    description: $attribute->description,
                    tags: $attribute->tags,
                    global: $attribute->global,
                );

                $discovered++;
            } catch (Throwable $exception) {
                // Isolate the failure — a single bad criterion must
                // not blow up the entire boot sequence.
                logger()->error(
                    "Failed to register criteria [{$className}]: {$exception->getMessage()}",
                );
            }
        }

        return $discovered;
    }
}
