<?php

declare(strict_types=1);

namespace Academorix\SportsSeasonSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\SportsSeasonSdk\Data\SeasonData;
use Academorix\SportsSeasonSdk\Requests\Seasons\CreateSeasonRequest;
use Academorix\SportsSeasonSdk\Requests\Seasons\DeleteSeasonRequest;
use Academorix\SportsSeasonSdk\Requests\Seasons\ListSeasonsAdminRequest;
use Academorix\SportsSeasonSdk\Requests\Seasons\ListSeasonsRequest;
use Academorix\SportsSeasonSdk\Requests\Seasons\ShowSeasonAdminRequest;
use Academorix\SportsSeasonSdk\Requests\Seasons\ShowSeasonRequest;
use Academorix\SportsSeasonSdk\Requests\Seasons\UpdateSeasonRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `seasons` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/Seasons/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category SeasonSdk
 *
 * @since    0.1.0
 */
final readonly class SeasonsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every season.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<SeasonData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListSeasonsRequest($page, $perPage))->dto();
    }


    /**
     * Create a season.
     *
     * @param  CreateSeasonPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return SeasonData
     */
    public function create(\Academorix\SportsSeasonSdk\Payloads\Seasons\CreateSeasonPayload $payload, ?string $idempotencyKey = null): SeasonData
    {
        return $this->connector->send(new CreateSeasonRequest($payload, $idempotencyKey))->dto();
    }


    /**
     * Show one season.
     *
     * @param  string  $season                 Path parameter — season.
     *
     * @return SeasonData
     */
    public function show(string $season): SeasonData
    {
        return $this->connector->send(new ShowSeasonRequest($season))->dto();
    }


    /**
     * Update one season.
     *
     * @param  string  $season                 Path parameter — season.
     * @param  UpdateSeasonPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return SeasonData
     */
    public function update(string $season, \Academorix\SportsSeasonSdk\Payloads\Seasons\UpdateSeasonPayload $payload, ?string $idempotencyKey = null): SeasonData
    {
        return $this->connector->send(new UpdateSeasonRequest($season, $payload, $idempotencyKey))->dto();
    }


    /**
     * Delete one season.
     *
     * @param  string  $season                 Path parameter — season.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     */
    public function delete(string $season, ?string $idempotencyKey = null): void
    {
        $this->connector->send(new DeleteSeasonRequest($season, $idempotencyKey));
    }


    /**
     * List every season.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<SeasonData>
     */
    public function listAdmin(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListSeasonsAdminRequest($page, $perPage))->dto();
    }


    /**
     * Show one season.
     *
     * @param  string  $season                 Path parameter — season.
     *
     * @return SeasonData
     */
    public function showAdmin(string $season): SeasonData
    {
        return $this->connector->send(new ShowSeasonAdminRequest($season))->dto();
    }
}
