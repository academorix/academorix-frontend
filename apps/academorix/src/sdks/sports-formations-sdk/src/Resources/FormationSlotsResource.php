<?php

declare(strict_types=1);

namespace Academorix\SportsFormationsSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\SportsFormationsSdk\Data\FormationSlotData;
use Saloon\Http\Response;

/**
 * Peer Resource for the `formation-slots` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/FormationSlots/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category FormationsSdk
 *
 * @since    0.1.0
 */
final readonly class FormationSlotsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }

}
