<?php

/**
 * @file packages/framework/caching/src/Contracts/CacheTagResolver.php
 *
 * @description
 * Every class that contributes cache-tag segments to the shared
 * builder implements this contract. The builder walks every
 * registered resolver at compose time and concatenates the
 * segments each returns into the final tag list handed to
 * `Cache::tags([...])`.
 *
 * ## Discovery
 *
 * Implementations are marked with
 * {@see \Academorix\Caching\Attributes\AsCacheTagResolver} — the
 * `CachingServiceProvider` performs a single boot-time discovery
 * pass via `olvlvl/composer-attribute-collector` and hydrates
 * a memoised registry ({@see \Academorix\Caching\Registry\CacheTagResolverRegistry}).
 * Under Octane this reflection cost is paid once per worker.
 *
 * ## Composition model
 *
 * Resolvers are additive, not authoritative. Every resolver
 * contributes ZERO or more segments; the builder concatenates.
 * That lets orthogonal concerns (tenant id, locale, feature
 * flag, role scope) each ship their own resolver without
 * knowing about one another.
 *
 * ```php
 * // TenantAwareCacheTagResolver returns ['tenant:42']
 * // LocaleAwareCacheTagResolver returns ['locale:en']
 * // Final tag list for entity 'athletes':
 * //   ['athletes', 'tenant:42', 'locale:en']
 * ```
 *
 * ## Emptiness is legal
 *
 * When a resolver has nothing to contribute (e.g. the tenant
 * resolver called from a central-DB maintenance job with no
 * tenant bound), it MUST return `[]`. Callers never have to
 * null-check.
 *
 * ## Ordering
 *
 * The `#[AsCacheTagResolver(priority: N)]` marker controls
 * ordering — lower numbers run first, matching the convention
 * of `#[OnRegister(priority: N)]` in the service-provider
 * package. The default is `100`.
 *
 * @see \Academorix\Caching\Attributes\AsCacheTagResolver Discovery marker.
 * @see \Academorix\Caching\Support\CacheTagBuilder Consumer.
 * @see \Academorix\Caching\Resolvers\NullCacheTagResolver Default no-op.
 */

declare(strict_types=1);

namespace Academorix\Caching\Contracts;

/**
 * Contributes zero-or-more tag segments to the composed tag
 * chain. Discovered at boot via `#[AsCacheTagResolver]`.
 */
interface CacheTagResolver
{
    /**
     * Return the segments this resolver contributes.
     *
     * The `$context` map is a free-form associative array of
     * hints the caller can pass to inform the resolver — the
     * canonical entries are:
     *
     *   - `table` (string) — the physical table being tagged.
     *   - `operation` (string) — `read` / `write` / `flush`.
     *   - `entityId` (int|string|null) — primary key when known.
     *
     * Implementations are free to ignore keys they don't care
     * about; new keys can be introduced without breaking older
     * resolvers.
     *
     * @param  array<string, mixed>  $context
     * @return list<string>
     */
    public function resolve(array $context = []): array;
}
