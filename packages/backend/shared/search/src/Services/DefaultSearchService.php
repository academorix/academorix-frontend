<?php

declare(strict_types=1);

namespace Stackra\Search\Services;

use Stackra\Search\Contracts\Services\SearchServiceInterface;
use Illuminate\Container\Attributes\Scoped;

/**
 * Minimum-viable {@see SearchServiceInterface}.
 *
 * Returns an empty result envelope; consumer apps override by
 * binding their own concrete through the interface's `#[Bind]`.
 *
 * `#[Scoped]` — the service references the resolved tenant + user
 * scope; a singleton would capture boot-time context under Octane.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Scoped]
final class DefaultSearchService implements SearchServiceInterface
{
    /**
     * {@inheritDoc}
     */
    public function query(string $query, array $options = []): array
    {
        // Scaffold — real dispatch through the resolved engine adapter
        // lands with the engine-adapter build-out. Returning a shape
        // that matches the eventual envelope keeps callers unbroken.
        return [
            'query' => $query,
            'hits'  => [],
            'meta'  => [
                'total'   => 0,
                'took_ms' => 0,
                'engine'  => (string) ($options['engine'] ?? \config('search.engines.default', 'meilisearch')),
            ],
            'facets' => [],
        ];
    }
}
