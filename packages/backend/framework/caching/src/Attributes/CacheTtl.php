<?php

/**
 * @file packages/framework/caching/src/Attributes/CacheTtl.php
 *
 * @description
 * Standalone TTL override — useful when the cache directive
 * itself lives on the class body (`#[Cacheable]` on the class)
 * but one method needs a different lifetime.
 *
 * ## Precedence
 *
 * When both `#[Cacheable]` and `#[CacheTtl]` are present on the
 * same target, `#[CacheTtl]::$seconds` wins. Otherwise the
 * fallback chain is:
 *
 *   1. `#[CacheTtl]` on the method.
 *   2. `#[Cacheable]::$ttl` on the method.
 *   3. `#[CacheTtl]` on the class.
 *   4. `#[Cacheable]::$ttl` on the class.
 *   5. `caching.default_ttl` config value.
 *
 * ## Example
 *
 * ```php
 * #[Cacheable(tags: ['athletes'])]   // class-level default: 300s
 * final class AthleteRepository
 * {
 *     public function all(): Collection { … }         // 300s
 *
 *     #[CacheTtl(60)]                                 // 60s
 *     public function trending(): Collection { … }
 * }
 * ```
 */

declare(strict_types=1);

namespace Stackra\Caching\Attributes;

use Attribute;

/**
 * Override the cache TTL for a specific method / class scope.
 */
#[Attribute(Attribute::TARGET_METHOD | Attribute::TARGET_CLASS)]
final readonly class CacheTtl
{
    /**
     * @param  int  $seconds  TTL in seconds. MUST be positive; a value of 0 is treated as "never expire".
     */
    public function __construct(
        public int $seconds,
    ) {
    }
}
