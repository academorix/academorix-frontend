<?php

declare(strict_types=1);

namespace Academorix\SportsCompetitionSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\SportsCompetitionSdk\Data\StandingRowData;
use Saloon\Http\Response;

/**
 * Peer Resource for the `standing-rows` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/StandingRows/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category CompetitionSdk
 *
 * @since    0.1.0
 */
final readonly class StandingRowsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }

}
