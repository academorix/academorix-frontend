<?php

/**
 * @file src/Services/ScopeManager.php
 *
 * @description
 * Aggregator service that composes {@see ScopeContextInterface} +
 * {@see ScopeResolutionInterface} + {@see ScopeEmulatorInterface}
 * into the single surface the {@see \Stackra\Scope\Facades\Scope}
 * facade points at. Follows the "manager class = facade target"
 * pattern used across framework facades in this monorepo
 * (`Json` → `JsonInterface`, `Serializer` → `SerializerInterface`).
 */

declare(strict_types=1);

namespace Stackra\Scope\Services;

use Stackra\Scope\Contracts\ScopeContextInterface;
use Stackra\Scope\Contracts\ScopeEmulatorInterface;
use Stackra\Scope\Contracts\ScopeResolutionInterface;
use Stackra\Scope\Data\ResolvedScopeValue;
use Stackra\Scope\Data\ScopeContextData;
use Stackra\Scope\Exceptions\ScopeContextRequiredException;
use Stackra\Scope\Facades\Scope;
use Stackra\Scope\Models\ScopeNode;
use Illuminate\Container\Attributes\Scoped;

/**
 * Facade target for {@see Scope}.
 *
 * ## Lifetime — `#[Scoped]`
 *
 * The three underlying services are scoped (per-request); the
 * manager that wraps them shares that lifetime so it never
 * outlives its dependencies. Octane resets the scoped bindings
 * between requests, and the manager along with them.
 *
 * ## API
 *
 * Every method here maps 1-to-1 onto one of the underlying
 * services. Kept as thin delegates so the facade docblock's
 * `@method` annotations stay honest — call-site users see the
 * exact signatures they'd get from the underlying service.
 */
#[Scoped]
final readonly class ScopeManager
{
    /**
     * @param  ScopeContextInterface  $context  Request-scoped
     *                                          "who am I resolving for?" holder.
     * @param  ScopeResolutionInterface  $resolution  Cascading value
     *                                                reader.
     * @param  ScopeEmulatorInterface  $emulator  Temporary-
     *                                            scope wrapper for impersonation + background jobs.
     */
    public function __construct(
        private ScopeContextInterface $context,
        private ScopeResolutionInterface $resolution,
        private ScopeEmulatorInterface $emulator,
    ) {}

    /**
     * The currently-active context, or `null` when no resolver
     * has run yet.
     */
    public function current(): ?ScopeContextData
    {
        return $this->context->get();
    }

    /**
     * The currently-active context, or throw
     * {@see ScopeContextRequiredException}
     * when unset.
     */
    public function currentOrFail(): ScopeContextData
    {
        return $this->context->getOrFail();
    }

    /**
     * Cascading read — walk the active node's materialised_path
     * from leaf to root and return the first stored value for
     * `(namespace, key)`.
     */
    public function resolve(string $namespace, string $key): ResolvedScopeValue
    {
        return $this->resolution->resolve($namespace, $key);
    }

    /**
     * Cascading read — every key under a namespace prefix at the
     * current scope.
     *
     * @return array<string, ResolvedScopeValue>
     */
    public function resolveMany(string $namespace, string $prefix = ''): array
    {
        return $this->resolution->resolveMany($namespace, $prefix);
    }

    /**
     * Run `$callback` under a layered scope. Restores the previous
     * context on return, whether the callback succeeds or throws.
     *
     * @template T
     *
     * @param  callable(): T  $callback
     * @return T
     */
    public function runIn(ScopeContextData $context, callable $callback): mixed
    {
        return $this->emulator->runIn($context, $callback);
    }

    /**
     * Same as {@see runIn()} but takes a ScopeNode and infers the
     * context from it.
     *
     * @template T
     *
     * @param  callable(): T  $callback
     * @return T
     */
    public function runInNode(ScopeNode $node, callable $callback): mixed
    {
        return $this->emulator->runInNode($node, $callback);
    }

    /**
     * Run `$callback` with NO active context. Reads throw unless
     * the callback pushes its own context.
     *
     * @template T
     *
     * @param  callable(): T  $callback
     * @return T
     */
    public function runInBlank(callable $callback): mixed
    {
        return $this->emulator->runInBlank($callback);
    }
}
