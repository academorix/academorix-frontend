<?php

declare(strict_types=1);

namespace Stackra\IdentityPeopleSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\IdentityPeopleSdk\Data\PersonIdentityData;
use Saloon\Http\Response;

/**
 * Peer Resource for the `person-identities` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/PersonIdentities/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category PeopleSdk
 *
 * @since    0.1.0
 */
final readonly class PersonIdentitiesResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }

}
