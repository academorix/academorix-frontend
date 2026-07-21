<?php

declare(strict_types=1);

namespace Stackra\SportsPrivateSessionsSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\SportsPrivateSessionsSdk\Data\SessionCreditData;
use Saloon\Http\Response;

/**
 * Peer Resource for the `session-credits` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/SessionCredits/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category PrivateSessionsSdk
 *
 * @since    0.1.0
 */
final readonly class SessionCreditsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }

}
