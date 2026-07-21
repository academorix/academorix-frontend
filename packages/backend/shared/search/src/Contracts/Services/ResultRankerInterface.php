<?php

declare(strict_types=1);

namespace Stackra\Search\Contracts\Services;

use Stackra\Search\Services\DefaultResultRanker;
use Illuminate\Container\Attributes\Bind;

/**
 * Hook that re-ranks the raw hit set returned by an engine adapter.
 *
 * The default implementation is a pass-through — consumer apps that
 * need custom ranking (recency boost, personalisation, deduplication
 * across engines) override by binding their own concrete through the
 * interface's `#[Bind]`.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Bind(DefaultResultRanker::class)]
interface ResultRankerInterface
{
    /**
     * Rank the given hits and return them in the desired order.
     *
     * @param  list<array<string, mixed>>  $hits     Raw hit set.
     * @param  array<string, mixed>        $context  Query context (query
     *                                               text, filters, user
     *                                               scope) — implementations
     *                                               may use this for
     *                                               personalisation.
     * @return list<array<string, mixed>>
     */
    public function rank(array $hits, array $context = []): array;
}
