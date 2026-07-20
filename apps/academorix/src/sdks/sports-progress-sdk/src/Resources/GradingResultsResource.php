<?php

declare(strict_types=1);

namespace Academorix\SportsProgressSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\SportsProgressSdk\Data\GradingResultData;
use Academorix\SportsProgressSdk\Requests\GradingResults\ShowGradingResultRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `grading-results` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/GradingResults/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category ProgressSdk
 *
 * @since    0.1.0
 */
final readonly class GradingResultsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * Show one gradingresult.
     *
     * @param  string  $result                 Path parameter — result.
     *
     * @return GradingResultData
     */
    public function show(string $result): GradingResultData
    {
        return $this->connector->send(new ShowGradingResultRequest($result))->dto();
    }
}
