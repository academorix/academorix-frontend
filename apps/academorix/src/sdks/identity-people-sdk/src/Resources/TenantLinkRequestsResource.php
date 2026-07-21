<?php

declare(strict_types=1);

namespace Stackra\IdentityPeopleSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\IdentityPeopleSdk\Data\TenantLinkRequestData;
use Saloon\Http\Response;

/**
 * Peer Resource for the `tenant-link-requests` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/TenantLinkRequests/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category PeopleSdk
 *
 * @since    0.1.0
 */
final readonly class TenantLinkRequestsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }

}
