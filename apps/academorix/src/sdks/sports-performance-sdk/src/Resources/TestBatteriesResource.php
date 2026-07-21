<?php

declare(strict_types=1);

namespace Stackra\SportsPerformanceSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\SportsPerformanceSdk\Data\TestBatteryData;
use Stackra\SportsPerformanceSdk\Requests\TestBatteries\CreateTestBatteryRequest;
use Stackra\SportsPerformanceSdk\Requests\TestBatteries\ListTestBatteriesRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `test-batteries` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/TestBatteries/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category PerformanceSdk
 *
 * @since    0.1.0
 */
final readonly class TestBatteriesResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every testbattery.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<TestBatteryData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListTestBatteriesRequest($page, $perPage))->dto();
    }


    /**
     * Create a testbattery.
     *
     * @param  CreateTestBatteryPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return TestBatteryData
     */
    public function create(\Stackra\SportsPerformanceSdk\Payloads\TestBatteries\CreateTestBatteryPayload $payload, ?string $idempotencyKey = null): TestBatteryData
    {
        return $this->connector->send(new CreateTestBatteryRequest($payload, $idempotencyKey))->dto();
    }
}
