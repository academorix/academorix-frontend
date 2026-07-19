<?php

declare(strict_types=1);

namespace Academorix\GrowthCrmLeadsSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\GrowthCrmLeadsSdk\Data\LeadActivityData;
use Saloon\Http\Response;

/**
 * Peer Resource for the `lead-activities` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/LeadActivities/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category CrmLeadsSdk
 *
 * @since    0.1.0
 */
final readonly class LeadActivitiesResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }

}
