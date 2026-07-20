<?php

declare(strict_types=1);

namespace Academorix\PlatformIntegrationsSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\PlatformIntegrationsSdk\Data\TenantIntegrationData;
use Academorix\PlatformIntegrationsSdk\Requests\TenantIntegrations\CreateTenantIntegrationRequest;
use Academorix\PlatformIntegrationsSdk\Requests\TenantIntegrations\DeleteTenantIntegrationRequest;
use Academorix\PlatformIntegrationsSdk\Requests\TenantIntegrations\ListTenantIntegrationsAdminRequest;
use Academorix\PlatformIntegrationsSdk\Requests\TenantIntegrations\ListTenantIntegrationsRequest;
use Academorix\PlatformIntegrationsSdk\Requests\TenantIntegrations\ShowTenantIntegrationRequest;
use Academorix\PlatformIntegrationsSdk\Requests\TenantIntegrations\UpdateTenantIntegrationRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `tenant-integrations` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/TenantIntegrations/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category IntegrationsSdk
 *
 * @since    0.1.0
 */
final readonly class TenantIntegrationsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every tenantintegration.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<TenantIntegrationData>
     */
    public function listAdmin(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListTenantIntegrationsAdminRequest($page, $perPage))->dto();
    }


    /**
     * List every tenantintegration.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<TenantIntegrationData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListTenantIntegrationsRequest($page, $perPage))->dto();
    }


    /**
     * Create a tenantintegration.
     *
     * @param  CreateTenantIntegrationPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return TenantIntegrationData
     */
    public function create(\Academorix\PlatformIntegrationsSdk\Payloads\TenantIntegrations\CreateTenantIntegrationPayload $payload, ?string $idempotencyKey = null): TenantIntegrationData
    {
        return $this->connector->send(new CreateTenantIntegrationRequest($payload, $idempotencyKey))->dto();
    }


    /**
     * Show one tenantintegration.
     *
     * @param  string  $integration            Path parameter — integration.
     *
     * @return TenantIntegrationData
     */
    public function show(string $integration): TenantIntegrationData
    {
        return $this->connector->send(new ShowTenantIntegrationRequest($integration))->dto();
    }


    /**
     * Update one tenantintegration.
     *
     * @param  string  $integration            Path parameter — integration.
     * @param  UpdateTenantIntegrationPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return TenantIntegrationData
     */
    public function update(string $integration, \Academorix\PlatformIntegrationsSdk\Payloads\TenantIntegrations\UpdateTenantIntegrationPayload $payload, ?string $idempotencyKey = null): TenantIntegrationData
    {
        return $this->connector->send(new UpdateTenantIntegrationRequest($integration, $payload, $idempotencyKey))->dto();
    }


    /**
     * Delete one tenantintegration.
     *
     * @param  string  $integration            Path parameter — integration.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     */
    public function delete(string $integration, ?string $idempotencyKey = null): void
    {
        $this->connector->send(new DeleteTenantIntegrationRequest($integration, $idempotencyKey));
    }
}
