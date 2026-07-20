<?php

declare(strict_types=1);

namespace Academorix\PlatformReceptionSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\PlatformReceptionSdk\Data\ReceptionVisitData;
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
