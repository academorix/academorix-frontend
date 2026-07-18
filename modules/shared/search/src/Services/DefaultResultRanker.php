<?php

declare(strict_types=1);

namespace Academorix\Search\Services;

use Academorix\Search\Contracts\Services\ResultRankerInterface;
use Illuminate\Container\Attributes\Singleton;

/**
 * Pass-through {@see ResultRankerInterface}.
 *
 * Returns hits in the order the engine adapter emitted them.
 * Consumer apps that need custom ranking (recency boost,
 * personalisation, cross-engine deduplication) override by binding
 * their own concrete through the interface's `#[Bind]`.
 *
 * `#[Singleton]` — the ranker is stateless.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Singleton]
final class DefaultResultRanker implements ResultRankerInterface
{
    /**
     * {@inheritDoc}
     */
    public function rank(array $hits, array $context = []): array
    {
        // Pass-through — trust the engine adapter's ranking by default.
        unset($context); // suppress unused-param warning.

        return $hits;
    }
}
