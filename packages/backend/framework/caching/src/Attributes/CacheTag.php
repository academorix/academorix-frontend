<?php

/**
 * @file packages/framework/caching/src/Attributes/CacheTag.php
 *
 * @description
 * Standalone tag directive — attaches an additional static tag
 * (or references a resolver class) to a method or class scope.
 * The tag builder merges these with the resolver chain output
 * when composing the final tag list.
 *
 * ## When to use over `#[Cacheable(tags: [...])]`
 *
 * `#[CacheTag]` is repeatable + composable — you can layer
 * multiple tag sources on one method without duplicating the
 * full `#[Cacheable]` block:
 *
 * ```php
 * #[Cacheable(ttl: 600, key: 'athletes:{id}')]
 * #[CacheTag('athletes')]
 * #[CacheTag('feature-flag:coach-dashboard')]
 * public function findById(int $id): ?Athlete { … }
 * ```
 *
 * When the tag needs to be RESOLVED at call-time (e.g. from the
 * current tenant), point at a resolver instead of a literal:
 *
 * ```php
 * #[CacheTag(resolver: TenantAwareCacheTagResolver::class)]
 * public function all(): Collection { … }
 * ```
 *
 * @see \Academorix\Caching\Contracts\CacheTagResolver Referenced resolver contract.
 */

declare(strict_types=1);

namespace Academorix\Caching\Attributes;

use Academorix\Caching\Contracts\CacheTagResolver;
use Attribute;

/**
 * Attach a tag (literal or resolver-backed) to a method / class.
 */
#[Attribute(Attribute::TARGET_METHOD | Attribute::TARGET_CLASS | Attribute::IS_REPEATABLE)]
final readonly class CacheTag
{
    /**
     * @param  string|null                          $name
     *   Literal tag segment. Ignored when `$resolver` is set.
     *
     * @param  class-string<CacheTagResolver>|null  $resolver
     *   FQCN of a resolver to invoke at compose time. The
     *   returned segments are concatenated into the final tag
     *   list.
     */
    public function __construct(
        public ?string $name = null,
        public ?string $resolver = null,
    ) {
    }
}
