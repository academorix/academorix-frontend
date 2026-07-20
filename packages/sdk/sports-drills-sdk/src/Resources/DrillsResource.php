<?php

declare(strict_types=1);

namespace Academorix\SportsDrillsSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\SportsDrillsSdk\Data\DrillData;
use Academorix\SportsDrillsSdk\Requests\Drills\CreateDrillRequest;
use Academorix\SportsDrillsSdk\Requests\Drills\ListDrillsRequest;
use Academorix\SportsDrillsSdk\Requests\Drills\ShowDrillRequest;
use Academorix\SportsDrillsSdk\Requests\Drills\UpdateDrillRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `drills` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/Drills/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category DrillsSdk
 *
 * @since    0.1.0
 */
final readonly class DrillsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every drill.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<DrillData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListDrillsRequest($page, $perPage))->dto();
    }


    /**
     * Create a drill.
     *
     * @param  CreateDrillPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return DrillData
     */
    public function create(\Academorix\SportsDrillsSdk\Payloads\Drills\CreateDrillPayload $payload, ?string $idempotencyKey = null): DrillData
    {
        return $this->connector->send(new CreateDrillRequest($payload, $idempotencyKey))->dto();
    }


    /**
     * Show one drill.
     *
     * @param  string  $drill                  Path parameter — drill.
     *
     * @return DrillData
     */
    public function show(string $drill): DrillData
    {
        return $this->connector->send(new ShowDrillRequest($drill))->dto();
    }


    /**
     * Update one drill.
     *
     * @param  string  $drill                  Path parameter — drill.
     * @param  UpdateDrillPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return DrillData
     */
    public function update(string $drill, \Academorix\SportsDrillsSdk\Payloads\Drills\UpdateDrillPayload $payload, ?string $idempotencyKey = null): DrillData
    {
        return $this->connector->send(new UpdateDrillRequest($drill, $payload, $idempotencyKey))->dto();
    }
}
