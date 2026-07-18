<?php

declare(strict_types=1);

namespace Academorix\Search\Jobs;

use Academorix\Search\Contracts\Data\SearchAnalyticsEventInterface;
use Academorix\Search\Contracts\Repositories\SearchAnalyticsEventRepositoryInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Async persistence of one `search_analytics_events` row.
 *
 * Dispatched from the search / suggest / click endpoints so the API
 * response returns without waiting on the write.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Queue('search-analytics')]
#[Tries(3)]
#[Backoff(5, 30, 300)]
final class RecordSearchAnalyticsEventJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param  array<string, mixed>  $payload
     */
    public function __construct(
        public readonly string $kind,
        public readonly array $payload,
    ) {
    }

    public function handle(SearchAnalyticsEventRepositoryInterface $analytics): void
    {
        // Fill in only the payload keys that map to real columns.
        // Extra keys are ignored to keep the DB write forgiving.
        $attrs = [SearchAnalyticsEventInterface::ATTR_KIND => $this->kind];

        foreach ($this->payload as $key => $value) {
            if (\str_starts_with($key, '_')) {
                continue;
            }
            $attrs[$key] = $value;
        }

        $analytics->create($attrs);
    }

    public function failed(\Throwable $e): void
    {
        unset($e);
    }
}
