<?php

declare(strict_types=1);

namespace Academorix\IdentityPeopleSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\IdentityPeopleSdk\Data\PersonIdentityData;
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
