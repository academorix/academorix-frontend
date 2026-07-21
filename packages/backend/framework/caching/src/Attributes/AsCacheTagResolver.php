<?php

/**
 * @file packages/framework/caching/src/Attributes/AsCacheTagResolver.php
 *
 * @description
 * Discovery marker for {@see \Stackra\Caching\Contracts\CacheTagResolver}
 * implementations. Placed on the class body — the
 * `CachingServiceProvider` calls `olvlvl/composer-attribute-collector`
 * once at boot to enumerate every class carrying this attribute,
 * sorts them by `priority`, and hydrates
 * {@see \Stackra\Caching\Registry\CacheTagResolverRegistry}.
 *
 * ## Why an attribute and not `bindings()`
 *
 * The lookup is a MANY-to-one composition — many resolvers feed
 * one builder. A `#[Bind]` binding is one-to-one and would
 * clobber previous resolvers. An attribute + registry pass is
 * the right shape for the "collect every X" case, and it is the
 * same pattern used across the monorepo (`#[AsHealthCheck]`,
 * `#[AsSeeder]`, `#[AsDatabaseBlueprint]`).
 *
 * ## Usage
 *
 * ```php
 * #[AsCacheTagResolver(priority: 100)]
 * final class TenantAwareCacheTagResolver implements CacheTagResolver
 * {
 *     public function resolve(array $context = []): array
 *     {
 *         $id = $this->context->id();
 *         return $id === null ? [] : ['tenant:' . $id];
 *     }
 * }
 * ```
 *
 * ## Priority ordering
 *
 * Lower numbers run first. The convention across the monorepo:
 *
 *   -   0..49  — critical / structural (tenancy, guard).
 *   -  50..149 — normal domain (locale, feature flag).
 *   - 150..∞   — cosmetic / experimental.
 *
 * Ties are broken by the resolver's fully-qualified class name
 * (alphabetical) so the tag order stays stable across runs.
 *
 * @see \Stackra\Caching\Contracts\CacheTagResolver Contract implementers satisfy.
 * @see \Stackra\Caching\Registry\CacheTagResolverRegistry Discovery target.
 */

declare(strict_types=1);

namespace Stackra\Caching\Attributes;

use Attribute;

/**
 * Marker attribute for cache-tag resolvers.
 *
 * `TARGET_CLASS` because resolvers are class-scoped; a single
 * class may implement `CacheTagResolver` and still carry
 * multiple attributes (`enabled=false` in one, `priority=200`
 * in another) when a consumer wants to fan out to a variant.
 * `IS_REPEATABLE` reflects that.
 */
#[Attribute(Attribute::TARGET_CLASS | Attribute::IS_REPEATABLE)]
final readonly class AsCacheTagResolver
{
    /**
     * @param  int   $priority  Lower runs first. See docblock for the ordering convention.
     * @param  bool  $enabled   Toggle a resolver at boot without deleting the marker (useful for feature flags).
     */
    public function __construct(
        public int $priority = 100,
        public bool $enabled = true,
    ) {
    }
}
