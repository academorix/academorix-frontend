<?php

declare(strict_types=1);

namespace Stackra\Search\Contracts\Services;

use Stackra\Search\Services\DefaultSearchService;
use Illuminate\Container\Attributes\Bind;

/**
 * Unified `Search::query()` entry point.
 *
 * Consumers reach this contract to execute a query across one or
 * more registered models. The default implementation delegates to
 * the resolved engine adapter via the {@see EngineRegistryInterface}
 * and records an analytics event via {@see AnalyticsRecorderInterface}.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Bind(DefaultSearchService::class)]
interface SearchServiceInterface
{
    /**
     * Execute one query. The `$options` map carries `filter`, `facets`,
     * `sort`, `page`, `per_page`, `highlight`, `boost`, `language`,
     * and `across` (list of model FQCNs).
     *
     * @param  string               $query    Raw query text.
     * @param  array<string, mixed> $options  Query options.
     * @return array<string, mixed>           Result envelope.
     */
    public function query(string $query, array $options = []): array;
}
