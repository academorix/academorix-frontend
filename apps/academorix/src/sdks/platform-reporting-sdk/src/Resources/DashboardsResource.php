<?php

declare(strict_types=1);

namespace Stackra\PlatformReportingSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\PlatformReportingSdk\Data\DashboardData;
use Stackra\PlatformReportingSdk\Requests\Dashboards\CreateDashboardRequest;
use Stackra\PlatformReportingSdk\Requests\Dashboards\ListDashboardsRequest;
use Stackra\PlatformReportingSdk\Requests\Dashboards\ShowDashboardRequest;
use Stackra\PlatformReportingSdk\Requests\Dashboards\UpdateDashboardRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `dashboards` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/Dashboards/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category ReportingSdk
 *
 * @since    0.1.0
 */
final readonly class DashboardsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every dashboard.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<DashboardData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListDashboardsRequest($page, $perPage))->dto();
    }


    /**
     * Create a dashboard.
     *
     * @param  CreateDashboardPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return DashboardData
     */
    public function create(\Stackra\PlatformReportingSdk\Payloads\Dashboards\CreateDashboardPayload $payload, ?string $idempotencyKey = null): DashboardData
    {
        return $this->connector->send(new CreateDashboardRequest($payload, $idempotencyKey))->dto();
    }


    /**
     * Show one dashboard.
     *
     * @param  string  $dashboard              Path parameter — dashboard.
     *
     * @return DashboardData
     */
    public function show(string $dashboard): DashboardData
    {
        return $this->connector->send(new ShowDashboardRequest($dashboard))->dto();
    }


    /**
     * Update one dashboard.
     *
     * @param  string  $dashboard              Path parameter — dashboard.
     * @param  UpdateDashboardPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return DashboardData
     */
    public function update(string $dashboard, \Stackra\PlatformReportingSdk\Payloads\Dashboards\UpdateDashboardPayload $payload, ?string $idempotencyKey = null): DashboardData
    {
        return $this->connector->send(new UpdateDashboardRequest($dashboard, $payload, $idempotencyKey))->dto();
    }
}
