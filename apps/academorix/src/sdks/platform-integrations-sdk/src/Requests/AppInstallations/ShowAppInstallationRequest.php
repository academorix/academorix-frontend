<?php

declare(strict_types=1);

namespace Stackra\PlatformIntegrationsSdk\Requests\AppInstallations;

use Stackra\ApiSdk\Requests\BaseSdkRequest;
use Stackra\PlatformIntegrationsSdk\Data\AppInstallationData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/app-installations/{install}` — show one AppInstallation.
 *
 * @category IntegrationsSdk
 *
 * @since    0.1.0
 */
final class ShowAppInstallationRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  string       $install                Path parameter — install.
     */
    public function __construct(
        public readonly string $install,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/app-installations/' . rawurlencode($this->install);
    }

    /**
     * Hydrate the `{ "data": ... }` envelope into a
     * {@see AppInstallationData}.
     */
    public function createDtoFromResponse(Response $response): AppInstallationData
    {
        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        /** @var array<string, mixed> $body */
        $body = isset($payload['data']) && is_array($payload['data'])
            ? $payload['data']
            : $payload;

        return AppInstallationData::from($body);
    }
}
