<?php

declare(strict_types=1);

namespace Academorix\Search\Contracts\Services;

use Academorix\Search\Services\DefaultSynonymRegistry;
use Illuminate\Container\Attributes\Bind;

/**
 * Per-tenant synonym resolver.
 *
 * `resolve()` returns the effective set of active synonyms for the
 * current `(tenant, language)` pair — the union of platform-seeded
 * system rows and tenant-owned rows, filtered by `is_active`. The
 * result is cached for `search.synonyms.cache_ttl_seconds` seconds.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Bind(DefaultSynonymRegistry::class)]
interface SynonymRegistryInterface
{
    /**
     * Effective synonyms for one `(tenant, language)` pair.
     *
     * @return list<array<string, mixed>>
     */
    public function resolve(?string $tenantId, string $language): array;

    /**
     * Invalidate the cached synonym set for one `(tenant, language)` pair.
     */
    public function invalidate(?string $tenantId, string $language): void;
}
