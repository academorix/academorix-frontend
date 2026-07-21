<?php

declare(strict_types=1);

namespace Stackra\SportsCompetitionSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\SportsCompetitionSdk\Data\CompetitionData;
use Stackra\SportsCompetitionSdk\Requests\Competitions\CreateCompetitionRequest;
use Stackra\SportsCompetitionSdk\Requests\Competitions\ListCompetitionsRequest;
use Stackra\SportsCompetitionSdk\Requests\Competitions\ShowCompetitionRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `competitions` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/Competitions/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category CompetitionSdk
 *
 * @since    0.1.0
 */
final readonly class CompetitionsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every competition.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<CompetitionData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListCompetitionsRequest($page, $perPage))->dto();
    }


    /**
     * Create a competition.
     *
     * @param  CreateCompetitionPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return CompetitionData
     */
    public function create(\Stackra\SportsCompetitionSdk\Payloads\Competitions\CreateCompetitionPayload $payload, ?string $idempotencyKey = null): CompetitionData
    {
        return $this->connector->send(new CreateCompetitionRequest($payload, $idempotencyKey))->dto();
    }


    /**
     * Show one competition.
     *
     * @param  string  $competition            Path parameter — competition.
     *
     * @return CompetitionData
     */
    public function show(string $competition): CompetitionData
    {
        return $this->connector->send(new ShowCompetitionRequest($competition))->dto();
    }


    /**
     * Show one competition.
     *
     * @param  string  $signature              Path parameter — signature.
     *
     * @return CompetitionData
     */
    public function show(string $signature): CompetitionData
    {
        return $this->connector->send(new ShowCompetitionRequest($signature))->dto();
    }
}
