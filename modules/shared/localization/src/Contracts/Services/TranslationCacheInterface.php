<?php

declare(strict_types=1);

namespace Academorix\Localization\Contracts\Services;

use Academorix\Localization\Services\RedisTranslationCache;
use Illuminate\Container\Attributes\Bind;

/**
 * Read-through cache in front of the {@see \Academorix\Localization\Models\Translation} table.
 *
 * The decorated Translator asks this contract first — a hit avoids
 * the DB round-trip entirely; a miss loads the row + populates the
 * cache before returning.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[Bind(RedisTranslationCache::class)]
interface TranslationCacheInterface
{
    /**
     * Fetch a cached translation.
     *
     * @param  string|null  $tenantId    Tenant id or null for platform default.
     * @param  string       $localeCode  BCP-47 tag.
     * @param  string       $namespace   Namespace bucket.
     * @param  string       $group       Group name.
     * @param  string       $key         Translation key.
     * @return string|null  Cached value or null on miss.
     */
    public function get(
        ?string $tenantId,
        string $localeCode,
        string $namespace,
        string $group,
        string $key,
    ): ?string;

    /**
     * Store a translation into the cache under the passed composite
     * key. Honours the tag `translations:{tenant}:{locale}`.
     *
     * @param  string|null  $tenantId    Tenant id or null.
     * @param  string       $localeCode  BCP-47 tag.
     * @param  string       $namespace   Namespace bucket.
     * @param  string       $group       Group name.
     * @param  string       $key         Translation key.
     * @param  string       $value       The translated value.
     */
    public function put(
        ?string $tenantId,
        string $localeCode,
        string $namespace,
        string $group,
        string $key,
        string $value,
    ): void;

    /**
     * Invalidate the cache for `(tenant, locale)`. Called by the
     * translation observer on any mutation.
     *
     * @param  string|null  $tenantId    Tenant id or null.
     * @param  string       $localeCode  BCP-47 tag.
     */
    public function forget(?string $tenantId, string $localeCode): void;

    /**
     * Wipe the whole cache. Present for the reconcile command.
     */
    public function flush(): void;
}
