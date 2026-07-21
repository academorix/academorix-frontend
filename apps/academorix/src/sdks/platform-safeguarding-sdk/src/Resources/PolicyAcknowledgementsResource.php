<?php

declare(strict_types=1);

namespace Stackra\PlatformSafeguardingSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\PlatformSafeguardingSdk\Data\PolicyAcknowledgementData;
use Stackra\PlatformSafeguardingSdk\Requests\PolicyAcknowledgements\ListPolicyAcknowledgementsRequest;
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
