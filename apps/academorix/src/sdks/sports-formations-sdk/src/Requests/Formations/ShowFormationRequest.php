<?php

declare(strict_types=1);

namespace Academorix\SportsFormationsSdk\Requests\Formations;

use Academorix\ApiSdk\Requests\BaseSdkRequest;
use Academorix\SportsFormationsSdk\Data\FormationData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/formations/{formation}` — show one Formation.
 *
 * @category FormationsSdk
 *
 * @since    0.1.0
 */
final class ShowFormationRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  string       $formation              Path parameter — formation.
     */
    public function __construct(
        public readonly string $formation,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/formations/' . rawurlencode($this->formation);
    }

    /**
     * Hydrate the `{ "data": ... }` envelope into a
     * {@see FormationData}.
     */
    public function createDtoFromResponse(Response $response): FormationData
    {
        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        /** @var array<string, mixed> $body */
        $body = isset($payload['data']) && is_array($payload['data'])
            ? $payload['data']
            : $payload;

        return FormationData::from($body);
    }
}
