<?php

declare(strict_types=1);

namespace Stackra\SportsRegistrationsSdk\Requests\Registrations;

use Stackra\ApiSdk\Requests\BaseSdkRequest;
use Stackra\SportsRegistrationsSdk\Data\RegistrationData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/registrations/{registration}` — show one Registration.
 *
 * @category RegistrationsSdk
 *
 * @since    0.1.0
 */
final class ShowRegistrationRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  string       $registration           Path parameter — registration.
     */
    public function __construct(
        public readonly string $registration,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/registrations/' . rawurlencode($this->registration);
    }

    /**
     * Hydrate the `{ "data": ... }` envelope into a
     * {@see RegistrationData}.
     */
    public function createDtoFromResponse(Response $response): RegistrationData
    {
        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        /** @var array<string, mixed> $body */
        $body = isset($payload['data']) && is_array($payload['data'])
            ? $payload['data']
            : $payload;

        return RegistrationData::from($body);
    }
}
