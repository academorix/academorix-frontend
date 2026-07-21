<?php

declare(strict_types=1);

namespace Stackra\PlatformIntegrationsSdk\Requests\Apps;

use Stackra\ApiSdk\Requests\BaseSdkRequest;
use Stackra\PlatformIntegrationsSdk\Data\AppData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/apps/{app}` — show one App.
 *
 * @category IntegrationsSdk
 *
 * @since    0.1.0
 */
final class ShowAppRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  string       $app                    Path parameter — app.
     */
    public function __construct(
        public readonly string $app,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/apps/' . rawurlencode($this->app);
    }

    /**
     * Hydrate the `{ "data": ... }` envelope into a
     * {@see AppData}.
     */
    public function createDtoFromResponse(Response $response): AppData
    {
        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        /** @var array<string, mixed> $body */
        $body = isset($payload['data']) && is_array($payload['data'])
            ? $payload['data']
            : $payload;

        return AppData::from($body);
    }
}
