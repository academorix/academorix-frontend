<?php

declare(strict_types=1);

namespace Stackra\PlatformIntegrationsSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\PlatformIntegrationsSdk\Data\AppData;
use Stackra\PlatformIntegrationsSdk\Requests\Apps\CreateAppRequest;
use Stackra\PlatformIntegrationsSdk\Requests\Apps\ListAppsAdminRequest;
use Stackra\PlatformIntegrationsSdk\Requests\Apps\ListAppsRequest;
use Stackra\PlatformIntegrationsSdk\Requests\Apps\ShowAppAdminRequest;
use Stackra\PlatformIntegrationsSdk\Requests\Apps\ShowAppRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `apps` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/Apps/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category IntegrationsSdk
 *
 * @since    0.1.0
 */
final readonly class AppsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every app.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<AppData>
     */
    public function listAdmin(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListAppsAdminRequest($page, $perPage))->dto();
    }


    /**
     * Create a app.
     *
     * @param  CreateAppPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return AppData
     */
    public function create(\Stackra\PlatformIntegrationsSdk\Payloads\Apps\CreateAppPayload $payload, ?string $idempotencyKey = null): AppData
    {
        return $this->connector->send(new CreateAppRequest($payload, $idempotencyKey))->dto();
    }


    /**
     * Show one app.
     *
     * @param  string  $app                    Path parameter — app.
     *
     * @return AppData
     */
    public function showAdmin(string $app): AppData
    {
        return $this->connector->send(new ShowAppAdminRequest($app))->dto();
    }


    /**
     * List every app.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<AppData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListAppsRequest($page, $perPage))->dto();
    }


    /**
     * Show one app.
     *
     * @param  string  $app                    Path parameter — app.
     *
     * @return AppData
     */
    public function show(string $app): AppData
    {
        return $this->connector->send(new ShowAppRequest($app))->dto();
    }
}
