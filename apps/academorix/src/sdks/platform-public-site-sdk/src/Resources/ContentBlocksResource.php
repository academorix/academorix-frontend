<?php

declare(strict_types=1);

namespace Stackra\PlatformPublicSiteSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\PlatformPublicSiteSdk\Data\ContentBlockData;
use Saloon\Http\Response;

/**
 * Peer Resource for the `content-blocks` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/ContentBlocks/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category PublicSiteSdk
 *
 * @since    0.1.0
 */
final readonly class ContentBlocksResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }

}
