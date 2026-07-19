<?php

declare(strict_types=1);

namespace Academorix\PlatformSafeguardingSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\PlatformSafeguardingSdk\Data\PolicyAcknowledgementData;
use Academorix\PlatformSafeguardingSdk\Requests\PolicyAcknowledgements\ListPolicyAcknowledgementsRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `policy-acknowledgements` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/PolicyAcknowledgements/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category SafeguardingSdk
 *
 * @since    0.1.0
 */
final readonly class PolicyAcknowledgementsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every policyacknowledgement.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<PolicyAcknowledgementData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListPolicyAcknowledgementsRequest($page, $perPage))->dto();
    }
}
