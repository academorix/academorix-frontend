<?php

declare(strict_types=1);

namespace Academorix\PlatformReportingSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\PlatformReportingSdk\Data\SavedReportData;
use Saloon\Http\Response;

/**
 * Peer Resource for the `saved-reports` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/SavedReports/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category ReportingSdk
 *
 * @since    0.1.0
 */
final readonly class SavedReportsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }

}
