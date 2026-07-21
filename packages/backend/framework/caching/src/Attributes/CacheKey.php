<?php

/**
 * @file packages/framework/caching/src/Attributes/CacheKey.php
 *
 * @description
 * Standalone key template attribute. Placed on a method (or the
 * class body for a default template shared across every method)
 * to declare the key shape without also supplying TTL / tags —
 * useful when `#[Cacheable]` is not applied but a caller uses
 * `CacheKeyBuilder::forCall()` to produce a key.
 *
 * ## Interpolation
 *
 * `{argName}` is replaced by the corresponding named argument's
 * scalar cast. Non-scalar arguments (objects, arrays) are
 * hashed via `xxh128` to keep the resulting key stable + short.
 *
 * Special tokens:
 *
 *   - `{class}`  — the class' FQCN (dot-separated).
 *   - `{method}` — the method name.
 *   - `{hash}`   — a short hash of every unnamed argument slot.
 *
 * ## Example
 *
 * ```php
 * #[CacheKey('athletes:{tenantId}:{filters}')]
 * public function search(string $tenantId, FilterBag $filters): Collection { … }
 * ```
 *
 * @see \Stackra\Caching\Support\CacheKeyBuilder Consumer.
 * @see \Stackra\Caching\Attributes\Cacheable Uses this template when `$key` is unset.
 */

declare(strict_types=1);

namespace Stackra\Caching\Attributes;

use Attribute;

/**
 * Declare a key template for a method or class.
 */
#[Attribute(Attribute::TARGET_METHOD | Attribute::TARGET_CLASS)]
final readonly class CacheKey
{
    /**
     * @param  string  $template  Key template with `{argName}` slots.
     */
    public function __construct(
        public string $template,
    ) {
    }
}
