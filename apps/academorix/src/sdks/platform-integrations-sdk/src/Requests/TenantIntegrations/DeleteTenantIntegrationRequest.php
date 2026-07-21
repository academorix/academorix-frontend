<?php

declare(strict_types=1);

namespace Stackra\PlatformIntegrationsSdk\Requests\TenantIntegrations;

use Stackra\ApiSdk\Requests\BaseSdkRequest;
use Stackra\PlatformIntegrationsSdk\Data\TenantIntegrationData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `DELETE /api/v1/tenant-integrations/{integration}` — delete one TenantIntegration.
 *
 * @category IntegrationsSdk
 *
 * @since    0.1.0
 */
final class DeleteTenantIntegrationRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::DELETE;

    /**
     * @param  string       $integration            Path parameter — integration.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     */
    public function __construct(
        public readonly string $integration,
        public readonly ?string $idempotencyKey = null,
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
     * Attach the caller-supplied idempotency key when one was provided.
     *
     * @return array<string, string>
     */
    protected function defaultHeaders(): array
    {
        return $this->idempotencyKey !== null
            ? ['Idempotency-Key' => $this->idempotencyKey]
            : [];
    }

    /**
     * Delete returns 204 No Content — no DTO to hydrate.
     */
    public function createDtoFromResponse(Response $response): null
    {
        return null;
    }
}
