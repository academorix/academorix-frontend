<?php

declare(strict_types=1);

namespace Academorix\Search\Contracts\Services;

use Academorix\Search\Enums\AnalyticsEventKind;
use Academorix\Search\Services\DefaultAnalyticsRecorder;
use Illuminate\Container\Attributes\Bind;

/**
 * Async analytics recorder — dispatches a `RecordSearchAnalyticsEventJob`
 * off the request thread so query latency is not affected.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Bind(DefaultAnalyticsRecorder::class)]
interface AnalyticsRecorderInterface
{
    /**
     * Record one analytics event.
     *
     * @param  AnalyticsEventKind    $kind     Event kind.
     * @param  array<string, mixed>  $payload  Event payload — merged into
     *                                         the row's `params` blob.
     */
    public function record(AnalyticsEventKind $kind, array $payload): void;
}
