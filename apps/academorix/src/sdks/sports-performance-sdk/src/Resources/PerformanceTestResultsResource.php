<?php

declare(strict_types=1);

namespace Stackra\SportsPerformanceSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\SportsPerformanceSdk\Data\PerformanceTestResultData;
use Stackra\SportsPerformanceSdk\Requests\PerformanceTestResults\CreatePerformanceTestResultRequest;
use Stackra\SportsPerformanceSdk\Requests\PerformanceTestResults\ListPerformanceTestResultsAdminRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `performance-test-results` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/PerformanceTestResults/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category PerformanceSdk
 *
 * @since    0.1.0
 */
final readonly class PerformanceTestResultsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * Create a performancetestresult.
     *
     * @param  CreatePerformanceTestResultPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return PerformanceTestResultData
     */
    public function create(\Stackra\SportsPerformanceSdk\Payloads\PerformanceTestResults\CreatePerformanceTestResultPayload $payload, ?string $idempotencyKey = null): PerformanceTestResultData
    {
        return $this->connector->send(new CreatePerformanceTestResultRequest($payload, $idempotencyKey))->dto();
    }


    /**
     * List every performancetestresult.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<PerformanceTestResultData>
     */
    public function listAdmin(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListPerformanceTestResultsAdminRequest($page, $perPage))->dto();
    }
}
