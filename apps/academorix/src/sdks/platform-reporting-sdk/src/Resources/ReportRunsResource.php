<?php

declare(strict_types=1);

namespace Academorix\PlatformReportingSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\PlatformReportingSdk\Data\ReportRunData;
use Saloon\Http\Response;

/**
 * Peer Resource for the `report-runs` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/ReportRuns/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category ReportingSdk
 *
 * @since    0.1.0
 */
final readonly class ReportRunsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }

}
