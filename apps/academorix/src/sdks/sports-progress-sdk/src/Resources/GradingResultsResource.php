<?php

declare(strict_types=1);

namespace Stackra\SportsProgressSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\SportsProgressSdk\Data\GradingResultData;
use Stackra\SportsProgressSdk\Requests\GradingResults\ShowGradingResultRequest;
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
