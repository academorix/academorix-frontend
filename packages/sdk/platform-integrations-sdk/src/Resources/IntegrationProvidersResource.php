<?php

declare(strict_types=1);

namespace Academorix\PlatformIntegrationsSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\PlatformIntegrationsSdk\Data\IntegrationProviderData;
use Academorix\PlatformIntegrationsSdk\Requests\IntegrationProviders\ListIntegrationProvidersAdminRequest;
use Academorix\PlatformIntegrationsSdk\Requests\IntegrationProviders\ListIntegrationProvidersRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `integration-providers` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/IntegrationProviders/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category IntegrationsSdk
 *
 * @since    0.1.0
 */
final readonly class IntegrationProvidersResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every integrationprovider.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<IntegrationProviderData>
     */
    public function listAdmin(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListIntegrationProvidersAdminRequest($page, $perPage))->dto();
    }


    /**
     * List every integrationprovider.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<IntegrationProviderData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListIntegrationProvidersRequest($page, $perPage))->dto();
    }
}
