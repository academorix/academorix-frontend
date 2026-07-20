<?php

declare(strict_types=1);

namespace Academorix\PlatformCredentialsSdk\Requests\Credentials;

use Academorix\ApiSdk\Requests\BaseSdkRequest;
use Academorix\PlatformCredentialsSdk\Data\CredentialData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/credentials/{credential}` — show one Credential.
 *
 * @category CredentialsSdk
 *
 * @since    0.1.0
 */
final class ShowCredentialRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  string       $credential             Path parameter — credential.
     */
    public function __construct(
        public readonly string $credential,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/credentials/' . rawurlencode($this->credential);
    }

    /**
     * Hydrate the `{ "data": ... }` envelope into a
     * {@see CredentialData}.
     */
    public function createDtoFromResponse(Response $response): CredentialData
    {
        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        /** @var array<string, mixed> $body */
        $body = isset($payload['data']) && is_array($payload['data'])
            ? $payload['data']
            : $payload;

        return CredentialData::from($body);
    }
}
