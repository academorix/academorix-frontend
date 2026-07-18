<?php

declare(strict_types=1);

namespace Academorix\Search\Events;

use Academorix\Events\Attributes\AsEvent;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched after one `kind = no_results` analytics event lands.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'search.no_results.recorded')]
final readonly class SearchNoResultsRecorded
{
    use Dispatchable;

    /**
     * @param  list<string>  $indexNames
     */
    public function __construct(
        public string $searchAnalyticsEventId,
        public ?string $tenantId,
        public string $engine,
        public array $indexNames,
        public string $queryHash,
    ) {
    }
}
