<?php

declare(strict_types=1);

namespace Academorix\SportsMedicalSdk\Requests\Injuries;

use Academorix\ApiSdk\Requests\BaseSdkRequest;
use Academorix\SportsMedicalSdk\Data\InjuryData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/injuries/{injury}` — show one Injury.
 *
 * @category MedicalSdk
 *
 * @since    0.1.0
 */
final class ShowInjuryRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  string       $injury                 Path parameter — injury.
     */
    public function __construct(
        public readonly string $injury,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/injuries/' . rawurlencode($this->injury);
    }

    /**
     * Hydrate the `{ "data": ... }` envelope into a
     * {@see InjuryData}.
     */
    public function createDtoFromResponse(Response $response): InjuryData
    {
        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        /** @var array<string, mixed> $body */
        $body = isset($payload['data']) && is_array($payload['data'])
            ? $payload['data']
            : $payload;

        return InjuryData::from($body);
    }
}
