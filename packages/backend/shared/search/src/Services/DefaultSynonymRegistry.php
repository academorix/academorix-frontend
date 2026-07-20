<?php

declare(strict_types=1);

namespace Academorix\Search\Services;

use Academorix\Search\Contracts\Data\SearchSynonymInterface;
use Academorix\Search\Contracts\Repositories\SearchSynonymRepositoryInterface;
use Academorix\Search\Contracts\Services\SynonymRegistryInterface;
use Illuminate\Container\Attributes\Scoped;

/**
 * Minimum-viable {@see SynonymRegistryInterface}.
 *
 * Reads active synonym rows via the repository; the engine-native
 * caching layer lands with the engine-adapter build-out.
 *
 * `#[Scoped]` — the resolver reads tenant-scoped rows and depends on
 * per-request context.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Scoped]
final class DefaultSynonymRegistry implements SynonymRegistryInterface
{
    public function __construct(
        private readonly SearchSynonymRepositoryInterface $synonyms,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function resolve(?string $tenantId, string $language): array
    {
        return $this->synonyms
            ->activeFor($tenantId, $language)
            ->map(static fn ($row): array => [
                'id'              => (string) $row->getKey(),
                'kind'            => (string) $row->{SearchSynonymInterface::ATTR_KIND}?->value,
                'terms'           => (array) ($row->{SearchSynonymInterface::ATTR_TERMS} ?? []),
                'one_way_source'  => $row->{SearchSynonymInterface::ATTR_ONE_WAY_SOURCE},
                'one_way_targets' => (array) ($row->{SearchSynonymInterface::ATTR_ONE_WAY_TARGETS} ?? []),
                'language'        => (string) $row->{SearchSynonymInterface::ATTR_LANGUAGE},
            ])
            ->all();
    }

    /**
     * {@inheritDoc}
     */
    public function invalidate(?string $tenantId, string $language): void
    {
        // Cache invalidation lands with the engine-native cache
        // layer. Signature preserved so callers depend on the
        // interface rather than the concrete.
        unset($tenantId, $language); // suppress unused-param warning.
    }
}
