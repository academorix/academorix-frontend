<?php

declare(strict_types=1);

namespace Academorix\SportsPrivateSessionsSdk\Requests\PrivateSessionRequests;

use Academorix\ApiSdk\Requests\BaseSdkRequest;
use Academorix\SportsPrivateSessionsSdk\Data\PrivateSessionRequestData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/private-session-requests/{request}` — show one PrivateSessionRequest.
 *
 * @category PrivateSessionsSdk
 *
 * @since    0.1.0
 */
final class ShowPrivateSessionRequestRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  string       $request                Path parameter — request.
     */
    public function __construct(
        public readonly string $request,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/private-session-requests/' . rawurlencode($this->request);
    }

    /**
     * Hydrate the `{ "data": ... }` envelope into a
     * {@see PrivateSessionRequestData}.
     */
    public function createDtoFromResponse(Response $response): PrivateSessionRequestData
    {
        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        /** @var array<string, mixed> $body */
        $body = isset($payload['data']) && is_array($payload['data'])
            ? $payload['data']
            : $payload;

        return PrivateSessionRequestData::from($body);
    }
}
