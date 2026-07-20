<?php

declare(strict_types=1);

namespace Academorix\SportsPerformanceSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\SportsPerformanceSdk\Data\PerformanceTestData;
use Academorix\SportsPerformanceSdk\Requests\PerformanceTests\CreatePerformanceTestRequest;
use Academorix\SportsPerformanceSdk\Requests\PerformanceTests\ListPerformanceTestsRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `performance-tests` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/PerformanceTests/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category PerformanceSdk
 *
 * @since    0.1.0
 */
final readonly class PerformanceTestsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every performancetest.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<PerformanceTestData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListPerformanceTestsRequest($page, $perPage))->dto();
    }


    /**
     * Create a performancetest.
     *
     * @param  CreatePerformanceTestPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return PerformanceTestData
     */
    public function create(\Academorix\SportsPerformanceSdk\Payloads\PerformanceTests\CreatePerformanceTestPayload $payload, ?string $idempotencyKey = null): PerformanceTestData
    {
        return $this->connector->send(new CreatePerformanceTestRequest($payload, $idempotencyKey))->dto();
    }
}
