<?php

declare(strict_types=1);

namespace Academorix\PlatformSafeguardingSdk\Requests\BackgroundChecks;

use Academorix\ApiSdk\Requests\BaseSdkRequest;
use Academorix\PlatformSafeguardingSdk\Data\BackgroundCheckData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/background-checks/{check}` — show one BackgroundCheck.
 *
 * @category SafeguardingSdk
 *
 * @since    0.1.0
 */
final class ShowBackgroundCheckRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  string       $check                  Path parameter — check.
     */
    public function __construct(
        public readonly string $check,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/background-checks/' . rawurlencode($this->check);
    }

    /**
     * Hydrate the `{ "data": ... }` envelope into a
     * {@see BackgroundCheckData}.
     */
    public function createDtoFromResponse(Response $response): BackgroundCheckData
    {
        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        /** @var array<string, mixed> $body */
        $body = isset($payload['data']) && is_array($payload['data'])
            ? $payload['data']
            : $payload;

        return BackgroundCheckData::from($body);
    }
}
