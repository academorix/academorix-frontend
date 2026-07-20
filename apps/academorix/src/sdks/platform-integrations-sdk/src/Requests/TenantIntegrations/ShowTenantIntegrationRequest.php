<?php

declare(strict_types=1);

namespace Academorix\PlatformIntegrationsSdk\Requests\TenantIntegrations;

use Academorix\ApiSdk\Requests\BaseSdkRequest;
use Academorix\PlatformIntegrationsSdk\Data\TenantIntegrationData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/tenant-integrations/{integration}` — show one TenantIntegration.
 *
 * @category IntegrationsSdk
 *
 * @since    0.1.0
 */
final class ShowTenantIntegrationRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  string       $integration            Path parameter — integration.
     */
    public function __construct(
        public readonly string $integration,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/tenant-integrations/' . rawurlencode($this->integration);
    }

    /**
     * Hydrate the `{ "data": ... }` envelope into a
     * {@see TenantIntegrationData}.
     */
    public function createDtoFromResponse(Response $response): TenantIntegrationData
    {
        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        /** @var array<string, mixed> $body */
        $body = isset($payload['data']) && is_array($payload['data'])
            ? $payload['data']
            : $payload;

        return TenantIntegrationData::from($body);
    }
}
