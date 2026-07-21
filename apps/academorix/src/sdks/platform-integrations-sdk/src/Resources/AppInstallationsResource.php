<?php

declare(strict_types=1);

namespace Stackra\PlatformIntegrationsSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\PlatformIntegrationsSdk\Data\AppInstallationData;
use Stackra\PlatformIntegrationsSdk\Requests\AppInstallations\CreateAppInstallationRequest;
use Stackra\PlatformIntegrationsSdk\Requests\AppInstallations\ListAppInstallationsAdminRequest;
use Stackra\PlatformIntegrationsSdk\Requests\AppInstallations\ListAppInstallationsRequest;
use Stackra\PlatformIntegrationsSdk\Requests\AppInstallations\ShowAppInstallationRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `app-installations` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/AppInstallations/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category IntegrationsSdk
 *
 * @since    0.1.0
 */
final readonly class AppInstallationsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every appinstallation.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<AppInstallationData>
     */
    public function listAdmin(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListAppInstallationsAdminRequest($page, $perPage))->dto();
    }


    /**
     * List every appinstallation.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<AppInstallationData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListAppInstallationsRequest($page, $perPage))->dto();
    }


    /**
     * Create a appinstallation.
     *
     * @param  CreateAppInstallationPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return AppInstallationData
     */
    public function create(\Stackra\PlatformIntegrationsSdk\Payloads\AppInstallations\CreateAppInstallationPayload $payload, ?string $idempotencyKey = null): AppInstallationData
    {
        return $this->connector->send(new CreateAppInstallationRequest($payload, $idempotencyKey))->dto();
    }


    /**
     * Show one appinstallation.
     *
     * @param  string  $install                Path parameter — install.
     *
     * @return AppInstallationData
     */
    public function show(string $install): AppInstallationData
    {
        return $this->connector->send(new ShowAppInstallationRequest($install))->dto();
    }
}
