<?php

declare(strict_types=1);

namespace Stackra\SportsDevelopmentSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\SportsDevelopmentSdk\Data\DevelopmentPathwayData;
use Saloon\Http\Response;

/**
 * Peer Resource for the `development-pathwaies` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/DevelopmentPathwaies/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category DevelopmentSdk
 *
 * @since    0.1.0
 */
final readonly class DevelopmentPathwaiesResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }

}
