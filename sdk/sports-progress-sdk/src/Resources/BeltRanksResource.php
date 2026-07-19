<?php

declare(strict_types=1);

namespace Academorix\SportsProgressSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\SportsProgressSdk\Data\BeltRankData;
use Academorix\SportsProgressSdk\Requests\BeltRanks\ListBeltRanksRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `belt-ranks` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/BeltRanks/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category ProgressSdk
 *
 * @since    0.1.0
 */
final readonly class BeltRanksResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every beltrank.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<BeltRankData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListBeltRanksRequest($page, $perPage))->dto();
    }
}
