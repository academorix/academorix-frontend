<?php

/**
 * @file src/Attributes/AsScopeResolver.php
 *
 * @description
 * Discovery marker for {@see \Academorix\Scope\Contracts\ScopeResolverInterface}
 * implementations. Placed on the class body — the
 * `ScopeServiceProvider` calls `olvlvl/composer-attribute-collector`
 * once at boot to enumerate every class carrying this attribute,
 * sorts them by `priority` (descending — higher wins), and hydrates
 * the {@see \Academorix\Scope\Contracts\ScopeResolverChainInterface}.
 *
 * Follows the same pattern as `#[AsCacheTagResolver]` from the
 * caching package (ADR 0004) so contributors have one convention
 * to learn instead of two.
 *
 * ## Priority direction — one gotcha
 *
 * The caching resolver chain sorts **ascending** (lower runs
 * first). The scope resolver chain sorts **descending** (higher
 * wins because it's a first-match-wins short-circuit, not a
 * fan-out). The `ScopeResolverPriority` enum values are the
 * canonical anchors (`Header = 100`, `RootFallback = 0`).
 */

declare(strict_types=1);

namespace Academorix\Scope\Attributes;

use Academorix\Scope\Enums\ScopeResolverPriority;
use Attribute;

/**
 * Marker attribute for scope resolvers.
 *
 * ## Usage
 *
 * ```php
 * use Academorix\Scope\Attributes\AsScopeResolver;
 * use Academorix\Scope\Enums\ScopeResolverPriority;
 *
 * #[AsScopeResolver(priority: ScopeResolverPriority::Header->value)]
 * final class HeaderScopeResolver implements ScopeResolverInterface { ... }
 * ```
 *
 * `IS_REPEATABLE` — one resolver class may carry multiple
 * attributes when a consumer wants the same implementation
 * registered under two priorities (rare, but supported for the
 * "fallback + override" pattern).
 */
#[Attribute(Attribute::TARGET_CLASS | Attribute::IS_REPEATABLE)]
final readonly class AsScopeResolver
{
    /**
     * @param  int  $priority  Higher runs earlier. Values from
     *                         {@see ScopeResolverPriority}
     *                         are the canonical anchors; custom
     *                         resolvers slot in with bare
     *                         integers.
     * @param  bool  $enabled  Toggle a resolver at boot without
     *                         deleting the marker — useful for
     *                         feature-flagged rollouts.
     */
    public function __construct(
        public int $priority = 100,
        public bool $enabled = true,
    ) {}
}
