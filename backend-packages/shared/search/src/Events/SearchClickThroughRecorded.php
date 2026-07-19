<?php

declare(strict_types=1);

namespace Academorix\Search\Events;

use Academorix\Events\Attributes\AsEvent;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched after one `kind = click_through` analytics event lands.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'search.click_through.recorded')]
final readonly class SearchClickThroughRecorded
{
    use Dispatchable;

    public function __construct(
        public string $searchAnalyticsEventId,
        public ?string $tenantId,
        public string $clickedResultType,
        public string $clickedResultId,
        public int $clickedPosition,
    ) {
    }
}
