<?php

/**
 * @file src/Contracts/ScopeRegistryInterface.php
 *
 * @description
 * Contract for the consumer-namespace registry. Every package that
 * stores values through the scope engine (settings, permissions,
 * feature flags, pricing, ...) registers its unique namespace once
 * at boot. The registry validates namespace format, prevents
 * duplicates, and hands back per-consumer configuration
 * (default-value factory + typed validator) to the resolver at
 * read/write time.
 */

declare(strict_types=1);

namespace Academorix\Scope\Contracts;

use Academorix\Scope\Data\ScopeConsumerConfig;
use Academorix\Scope\Exceptions\ScopeConflictException;
use Academorix\Scope\Exceptions\ScopeValidationException;
use Academorix\Scope\Services\ScopeRegistry;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Container\Attributes\Singleton;

/**
 * Namespace registry.
 *
 * Singleton — registrations are established at boot and don't change
 * per request. Registry state is intentionally in-memory (not a DB
 * table) because "which packages are installed" is a build-time
 * decision, not a runtime one.
 */
#[Bind(ScopeRegistry::class)]
#[Singleton]
interface ScopeRegistryInterface
{
    /**
     * Register a consumer namespace.
     *
     * Called from each consumer's service provider `boot()` method.
     * Namespaces must match the config `scope.namespace_regex`.
     *
     * @param  string  $namespace  Unique namespace slug
     *                             (1-64 chars, lower
     *                             alphanumeric +
     *                             underscores).
     * @param  ScopeConsumerConfig  $config  Per-consumer config:
     *                                       default-value factory
     *                                       + validator.
     *
     * @throws ScopeValidationException Namespace format invalid.
     * @throws ScopeConflictException Namespace already registered.
     */
    public function consumer(string $namespace, ScopeConsumerConfig $config): void;

    /**
     * Look up a consumer's config.
     *
     * @return ScopeConsumerConfig|null `null` when not registered.
     */
    public function get(string $namespace): ?ScopeConsumerConfig;

    /**
     * Test whether a namespace is registered.
     */
    public function has(string $namespace): bool;

    /**
     * Snapshot every registered namespace slug.
     *
     * Useful for admin surfaces + tests. Deterministic ordering
     * (alphabetical) so snapshots stay stable across boots.
     *
     * @return list<string>
     */
    public function all(): array;
}
