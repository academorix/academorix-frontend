<?php

declare(strict_types=1);

namespace Stackra\PlatformReportingSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\PlatformReportingSdk\Data\ReportDefinitionData;
use Saloon\Http\Response;

/**
 * Peer Resource for the `report-definitions` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/ReportDefinitions/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category ReportingSdk
 *
 * @since    0.1.0
 */
final readonly class ReportDefinitionsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }

}
