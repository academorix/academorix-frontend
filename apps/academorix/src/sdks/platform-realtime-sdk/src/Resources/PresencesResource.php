<?php

declare(strict_types=1);

namespace Stackra\PlatformRealtimeSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\PlatformRealtimeSdk\Data\PresenceData;
use Saloon\Http\Response;

/**
 * Peer Resource for the `presences` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/Presences/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category RealtimeSdk
 *
 * @since    0.1.0
 */
final readonly class PresencesResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }

}
