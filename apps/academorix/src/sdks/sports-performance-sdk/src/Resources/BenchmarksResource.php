<?php

declare(strict_types=1);

namespace Academorix\SportsPerformanceSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\SportsPerformanceSdk\Data\BenchmarkData;
use Academorix\SportsPerformanceSdk\Requests\Benchmarks\ListBenchmarksAdminRequest;
use Academorix\SportsPerformanceSdk\Requests\Benchmarks\ListBenchmarksRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `benchmarks` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/Benchmarks/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category PerformanceSdk
 *
 * @since    0.1.0
 */
final readonly class BenchmarksResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every benchmark.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<BenchmarkData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListBenchmarksRequest($page, $perPage))->dto();
    }


    /**
     * List every benchmark.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<BenchmarkData>
     */
    public function listAdmin(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListBenchmarksAdminRequest($page, $perPage))->dto();
    }
}
