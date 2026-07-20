<?php

declare(strict_types=1);

namespace Academorix\Search\Services;

use Academorix\Search\Contracts\Services\AnalyticsRecorderInterface;
use Academorix\Search\Enums\AnalyticsEventKind;
use Academorix\Search\Jobs\RecordSearchAnalyticsEventJob;
use Illuminate\Container\Attributes\Scoped;

/**
 * Default {@see AnalyticsRecorderInterface}.
 *
 * Dispatches a `RecordSearchAnalyticsEventJob` off the request thread
 * so query latency is not affected.
 *
 * `#[Scoped]` because the recorder pulls tenant + user context per
 * request under Octane.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Scoped]
final class DefaultAnalyticsRecorder implements AnalyticsRecorderInterface
{
    /**
     * {@inheritDoc}
     */
    public function record(AnalyticsEventKind $kind, array $payload): void
    {
        // Kill switch — recording can be disabled globally.
        if (! (bool) \config('search.analytics.record', true)) {
            return;
        }

        RecordSearchAnalyticsEventJob::dispatch($kind->value, $payload)
            ->onQueue((string) \config('search.queue.analytics_name', 'search-analytics'));
    }
}
