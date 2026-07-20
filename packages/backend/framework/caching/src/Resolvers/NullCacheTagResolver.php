<?php

/**
 * @file packages/framework/caching/src/Resolvers/NullCacheTagResolver.php
 *
 * @description
 * Default no-op resolver. Registered as the ONLY resolver when
 * no domain package ships an `#[AsCacheTagResolver]` — the tag
 * builder still functions, it just emits only the base table
 * segment (`['athletes']` with no additional tags).
 *
 * ## Why register a no-op
 *
 * `CacheTagBuilder` receives the resolver registry via
 * constructor. An empty registry would still work (the `for()`
 * / `forMany()` loops handle zero resolvers) but registering a
 * concrete null makes the injected graph explicit — a debugger
 * or `php artisan academorix:caching:diagnose` command lists
 * every registered resolver, and the null shows up as
 * "expected no-op" rather than "silently absent".
 *
 * ## Discovery
 *
 * The null resolver is discovered like any other via
 * `#[AsCacheTagResolver]` with `priority: 1000` (runs last so
 * it never masks a real resolver's output). The registry
 * de-duplicates by class name, so an app that ships its own
 * `#[AsCacheTagResolver]` with a higher priority simply pushes
 * the null further down the chain.
 *
 * @see \Academorix\Caching\Contracts\CacheTagResolver Contract.
 * @see \Academorix\Caching\Attributes\AsCacheTagResolver Discovery marker.
 */

declare(strict_types=1);

namespace Academorix\Caching\Resolvers;

use Academorix\Caching\Attributes\AsCacheTagResolver;
use Academorix\Caching\Contracts\CacheTagResolver;

/**
 * Contributes zero tag segments. Present so the resolver
 * registry is always non-empty and diagnostic tooling has a
 * concrete anchor.
 */
#[AsCacheTagResolver(priority: 1000)]
final readonly class NullCacheTagResolver implements CacheTagResolver
{
    /**
     * {@inheritDoc}
     *
     * @param  array<string, mixed>  $context
     * @return list<string>
     */
    public function resolve(array $context = []): array
    {
        return [];
    }
}
