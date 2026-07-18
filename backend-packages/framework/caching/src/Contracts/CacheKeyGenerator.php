<?php

/**
 * @file packages/framework/caching/src/Contracts/CacheKeyGenerator.php
 *
 * @description
 * Optional strategy contract for producing cache keys from a
 * method signature + call arguments. Consumed by the
 * `#[Cacheable]` interceptor when the attribute references a
 * generator class instead of a static key template.
 *
 * ## When to reach for a generator
 *
 * A static template (`#[Cacheable(key: 'athletes:{id}:{locale}')]`)
 * covers the 90% case. Reach for a `CacheKeyGenerator` when:
 *
 *   - The key depends on runtime state that isn't a method
 *     argument (feature flag, tenant scope, auth user).
 *   - The key needs a hash of a large struct (e.g. hashed JSON
 *     of a `FilterBag` argument) rather than a string interpolation.
 *   - Multiple methods on the same class share a bespoke key
 *     shape that would be verbose to repeat as a template.
 *
 * ## Determinism contract
 *
 * Implementations MUST be pure — same `$class`, `$method`,
 * `$args` MUST always produce the same key. The caching layer
 * treats the key as the sole identity of a cached entry; a
 * generator that leaks a `random_int()` or a clock read makes
 * every call a cache miss.
 *
 * ## Return shape
 *
 * A single string. Callers are responsible for prefixing the
 * app's own key namespace (`caching.tag_prefix`) when
 * appropriate — the generator itself SHOULD stay app-scope
 * agnostic.
 *
 * @see \Academorix\Caching\Attributes\Cacheable Attribute that dispatches to a generator.
 * @see \Academorix\Caching\Support\CacheKeyBuilder Default template-based implementation.
 */

declare(strict_types=1);

namespace Academorix\Caching\Contracts;

interface CacheKeyGenerator
{
    /**
     * Produce a deterministic cache key for the given call.
     *
     * @param  class-string          $class   FQCN of the class carrying the cached method.
     * @param  string                $method  Method name (case-sensitive).
     * @param  array<int|string, mixed>  $args    Positional + named arguments as passed to the method.
     */
    public function generate(string $class, string $method, array $args): string;
}
