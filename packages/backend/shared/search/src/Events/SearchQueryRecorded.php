<?php

declare(strict_types=1);

namespace Academorix\Search\Events;

use Academorix\Events\Attributes\AsEvent;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched after one `kind = query` analytics event lands.
 *
 * Fire-and-forget — not `ShouldDispatchAfterCommit`.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'search.query.recorded')]
final readonly class SearchQueryRecorded
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
        public int $resultCount,
        public int $tookMs,
    ) {
    }
}
