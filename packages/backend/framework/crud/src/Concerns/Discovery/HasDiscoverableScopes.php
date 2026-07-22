<?php

declare(strict_types=1);

/**
 * @file packages/crud/src/Concerns/Discovery/HasDiscoverableScopes.php
 *
 * @description
 * Trait that adds `#[AsScope]` discovery to a service provider (or any
 * host with access to the service container). Resolves the unified
 * {@see \Stackra\Foundation\Contracts\DiscoversAttributes} contract
 * — no direct dependency on the underlying attribute-manifest backend
 * (currently `olvlvl/composer-attribute-collector`, wrapped by
 * {@see \Stackra\Foundation\Discovery\AttributeDiscovery}).
 *
 * ## Boot-time contract
 *
 * Host classes (typically `CrudServiceProvider`) call
 * {@see discoverScopes()} once from `boot()`. The discovery pass is
 * O(hits) against a pre-compiled static manifest — no filesystem walk,
 * no per-request reflection, Octane-safe.
 *
 * ## Failure isolation
 *
 * A single misconfigured scope (missing Eloquent `Scope` interface,
 * unresolvable constructor, etc.) MUST NOT prevent the rest of the
 * discovery pass from running. Each hit is wrapped in its own
 * try/catch so one broken scope is logged and skipped.
 *
 * @category Concerns
 *
 * @since 2.0.0
 */

namespace Stackra\Crud\Concerns\Discovery;

use Stackra\Crud\Attributes\AsScope;
use Stackra\Crud\Registry\ScopeRegistry;
use Stackra\Foundation\Contracts\DiscoversAttributes;
use Illuminate\Database\Eloquent\Scope;
use Throwable;

/**
 * Discovers and registers scope classes annotated with `#[AsScope]`.
 *
 * @since 2.0.0
 */
trait HasDiscoverableScopes
{
    /**
     * Discover every class carrying `#[AsScope]` and register it with
     * the {@see ScopeRegistry}.
     *
     * The underlying {@see DiscoversAttributes} implementation gracefully
     * returns an empty iterable when the composer-attribute manifest
     * has not been written yet, so no defensive `class_exists()` guard
     * is required here.
     *
     * @return int Number of scopes successfully registered.
     */
    protected function discoverScopes(): int
    {
        /** @var DiscoversAttributes $discovery */
        $discovery = resolve(DiscoversAttributes::class);

        /** @var ScopeRegistry $registry */
        $registry = resolve(ScopeRegistry::class);

        $discovered = 0;

        foreach ($discovery->forClass(AsScope::class) as $target) {
            $className = $target->className;

            /** @var AsScope $attribute */
            $attribute = $target->attribute;

            try {
                // A class carrying `#[AsScope]` that doesn't implement
                // Eloquent's `Scope` contract is a programmer error;
                // skip silently — the architecture linter surfaces it.
                if (! is_subclass_of($className, Scope::class)) {
                    continue;
                }

                $registry->register(
                    name: $attribute->name,
                    class: $className,
                    description: $attribute->description,
                    tags: $attribute->tags,
                );

                $discovered++;
            } catch (Throwable $exception) {
                // Isolate the failure — a single bad scope must not
                // blow up the entire boot sequence.
                logger()->error(
                    "Failed to register scope [{$className}]: {$exception->getMessage()}",
                );
            }
        }

        return $discovered;
    }
}
