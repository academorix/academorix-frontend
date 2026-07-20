<?php

declare(strict_types=1);

namespace Academorix\SportsCompetitionSdk\Requests\CompetitionFixtures;

use Academorix\ApiSdk\Requests\BaseSdkRequest;
use Academorix\SportsCompetitionSdk\Data\CompetitionFixtureData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/competition-fixtures/{fixture}` — show one CompetitionFixture.
 *
 * @category CompetitionSdk
 *
 * @since    0.1.0
 */
final class ShowCompetitionFixtureRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  string       $fixture                Path parameter — fixture.
     */
    public function __construct(
        public readonly string $fixture,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/competition-fixtures/' . rawurlencode($this->fixture);
    }

    /**
     * Hydrate the `{ "data": ... }` envelope into a
     * {@see CompetitionFixtureData}.
     */
    public function createDtoFromResponse(Response $response): CompetitionFixtureData
    {
        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        /** @var array<string, mixed> $body */
        $body = isset($payload['data']) && is_array($payload['data'])
            ? $payload['data']
            : $payload;

        return CompetitionFixtureData::from($body);
    }
}
