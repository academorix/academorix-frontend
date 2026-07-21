<?php

declare(strict_types=1);

namespace Stackra\SportsDevelopmentSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\SportsDevelopmentSdk\Data\ScoutingReportData;
use Stackra\SportsDevelopmentSdk\Requests\ScoutingReports\CreateScoutingReportRequest;
use Stackra\SportsDevelopmentSdk\Requests\ScoutingReports\ListScoutingReportsAdminRequest;
use Stackra\SportsDevelopmentSdk\Requests\ScoutingReports\ListScoutingReportsRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `scouting-reports` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/ScoutingReports/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category DevelopmentSdk
 *
 * @since    0.1.0
 */
final readonly class ScoutingReportsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every scoutingreport.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<ScoutingReportData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListScoutingReportsRequest($page, $perPage))->dto();
    }


    /**
     * Create a scoutingreport.
     *
     * @param  CreateScoutingReportPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return ScoutingReportData
     */
    public function create(\Stackra\SportsDevelopmentSdk\Payloads\ScoutingReports\CreateScoutingReportPayload $payload, ?string $idempotencyKey = null): ScoutingReportData
    {
        return $this->connector->send(new CreateScoutingReportRequest($payload, $idempotencyKey))->dto();
    }


    /**
     * List every scoutingreport.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<ScoutingReportData>
     */
    public function listAdmin(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListScoutingReportsAdminRequest($page, $perPage))->dto();
    }
}
