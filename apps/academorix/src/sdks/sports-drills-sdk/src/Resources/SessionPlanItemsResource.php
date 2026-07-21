<?php

declare(strict_types=1);

namespace Stackra\SportsDrillsSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\SportsDrillsSdk\Data\SessionPlanItemData;
use Saloon\Http\Response;

/**
 * Peer Resource for the `session-plan-items` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/SessionPlanItems/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category DrillsSdk
 *
 * @since    0.1.0
 */
final readonly class SessionPlanItemsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }

}
