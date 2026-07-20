<?php

declare(strict_types=1);

namespace Academorix\SportsCompetitionSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\SportsCompetitionSdk\Data\CompetitionFixtureData;
use Academorix\SportsCompetitionSdk\Requests\CompetitionFixtures\ShowCompetitionFixtureRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `competition-fixtures` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/CompetitionFixtures/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category CompetitionSdk
 *
 * @since    0.1.0
 */
final readonly class CompetitionFixturesResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * Show one competitionfixture.
     *
     * @param  string  $fixture                Path parameter — fixture.
     *
     * @return CompetitionFixtureData
     */
    public function show(string $fixture): CompetitionFixtureData
    {
        return $this->connector->send(new ShowCompetitionFixtureRequest($fixture))->dto();
    }
}
