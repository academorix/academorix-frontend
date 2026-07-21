<?php

declare(strict_types=1);

namespace Stackra\PlatformReceptionSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\PlatformReceptionSdk\Data\ReceptionVisitData;
use Saloon\Http\Response;

/**
 * Peer Resource for the `reception-visits` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/ReceptionVisits/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category ReceptionSdk
 *
 * @since    0.1.0
 */
final readonly class ReceptionVisitsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }

}
