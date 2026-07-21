<?php

declare(strict_types=1);

namespace Stackra\SportsCompetitionSdk\Requests\Competitions;

use Stackra\ApiSdk\Requests\BaseSdkRequest;
use Stackra\SportsCompetitionSdk\Data\CompetitionData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/competitions/{competition}` — show one Competition.
 *
 * @category CompetitionSdk
 *
 * @since    0.1.0
 */
final class ShowCompetitionRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  string       $competition            Path parameter — competition.
     */
    public function __construct(
        public readonly string $competition,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/competitions/' . rawurlencode($this->competition);
    }

    /**
     * Hydrate the `{ "data": ... }` envelope into a
     * {@see CompetitionData}.
     */
    public function createDtoFromResponse(Response $response): CompetitionData
    {
        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        /** @var array<string, mixed> $body */
        $body = isset($payload['data']) && is_array($payload['data'])
            ? $payload['data']
            : $payload;

        return CompetitionData::from($body);
    }
}
