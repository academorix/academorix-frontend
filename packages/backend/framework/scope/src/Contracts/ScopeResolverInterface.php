<?php

/**
 * @file src/Contracts/ScopeResolverInterface.php
 *
 * @description
 * Contract for a single resolver in the resolver chain. Each
 * resolver inspects an incoming request and either returns a
 * concrete {@see ScopeContextData} or `null` to defer to the next
 * resolver in priority order. Resolvers are pure functions on the
 * request — they never mutate the container, database, or session.
 */

declare(strict_types=1);

namespace Academorix\Scope\Contracts;

use Academorix\Scope\Data\ScopeContextData;
use Academorix\Scope\Resolvers\HeaderScopeResolver;
use Academorix\Scope\Resolvers\JwtScopeResolver;
use Academorix\Scope\Resolvers\RootFallbackResolver;
use Academorix\Scope\Resolvers\TenantContextResolver;
use Illuminate\Http\Request;

/**
 * A single scope resolver — one link in the resolver chain.
 *
 * ## Contract
 *
 *  * `priority()` returns a stable integer. Higher = earlier. The
 *    chain sorts resolvers descending, so `100` beats `50`.
 *  * `resolve()` returns a ScopeContextData on hit, `null` on miss.
 *  * `resolve()` is idempotent — calling it twice on the same
 *    request MUST yield the same result.
 *  * `resolve()` MUST NOT throw for a missing scope; return `null`
 *    instead. Only unexpected failures (DB down, malformed data)
 *    should throw.
 *
 * ## Shipped implementations
 *
 *  * {@see HeaderScopeResolver}     priority 100
 *  * {@see JwtScopeResolver}         priority 80  (registered by auth)
 *  * {@see TenantContextResolver}   priority 60  (registered by tenancy)
 *  * {@see RootFallbackResolver}    priority 0
 */
interface ScopeResolverInterface
{
    /**
     * Stable identifier — the resolver chain deduplicates by this
     * value, so two resolvers with the same name replace each other.
     * Keep it short and lowercase (matches config keys).
     */
    public function name(): string;

    /**
     * Priority in the chain. Higher = earlier. Ties break by
     * registration order (later wins to allow overrides).
     */
    public function priority(): int;

    /**
     * Attempt to resolve the active scope from a request.
     *
     * @param  Request  $request  The active HTTP request.
     * @return ScopeContextData|null The resolved context, or
     *                               `null` to defer.
     */
    public function resolve(Request $request): ?ScopeContextData;
}
