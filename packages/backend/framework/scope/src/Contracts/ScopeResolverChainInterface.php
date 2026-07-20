<?php

/**
 * @file src/Contracts/ScopeResolverChainInterface.php
 *
 * @description
 * Contract for the ordered chain of {@see ScopeResolverInterface}
 * implementations that the middleware runs on every request. The
 * chain owns priority sorting, duplicate-name replacement, and the
 * short-circuit "first non-null wins" iteration.
 */

declare(strict_types=1);

namespace Academorix\Scope\Contracts;

use Academorix\Scope\Data\ScopeContextData;
use Academorix\Scope\Services\ScopeResolverChain;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Container\Attributes\Singleton;
use Illuminate\Http\Request;

/**
 * Ordered resolver chain — one instance per app, safely shared.
 *
 * Singleton because resolver registrations happen at boot and don't
 * change per request. Individual resolvers may themselves be scoped
 * (they receive request-scoped state via the container), but the
 * ordered list of resolver instances is stable app-wide.
 */
#[Bind(ScopeResolverChain::class)]
#[Singleton]
interface ScopeResolverChainInterface
{
    /**
     * Add a resolver to the chain (or replace an existing one with
     * the same name — see {@see ScopeResolverInterface::name()}).
     *
     * Re-sorts the chain by descending priority after every
     * registration so the order is stable at resolve-time.
     */
    public function register(ScopeResolverInterface $resolver): void;

    /**
     * Iterate the chain in priority order, returning the first
     * non-null resolver hit or `null` when every resolver defers.
     *
     * @param  Request  $request  The active request.
     */
    public function resolve(Request $request): ?ScopeContextData;

    /**
     * Snapshot the current chain (sorted, high-priority first).
     * Useful for tests + admin diagnostics.
     *
     * @return list<ScopeResolverInterface>
     */
    public function all(): array;
}
