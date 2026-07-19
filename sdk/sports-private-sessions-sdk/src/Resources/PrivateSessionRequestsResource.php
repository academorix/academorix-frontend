<?php

declare(strict_types=1);

namespace Academorix\SportsPrivateSessionsSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\SportsPrivateSessionsSdk\Data\PrivateSessionRequestData;
use Academorix\SportsPrivateSessionsSdk\Requests\PrivateSessionRequests\CreatePrivateSessionRequestRequest;
use Academorix\SportsPrivateSessionsSdk\Requests\PrivateSessionRequests\ListPrivateSessionRequestsRequest;
use Academorix\SportsPrivateSessionsSdk\Requests\PrivateSessionRequests\ShowPrivateSessionRequestRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `private-session-requests` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/PrivateSessionRequests/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category PrivateSessionsSdk
 *
 * @since    0.1.0
 */
final readonly class PrivateSessionRequestsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every privatesessionrequest.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<PrivateSessionRequestData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListPrivateSessionRequestsRequest($page, $perPage))->dto();
    }


    /**
     * Create a privatesessionrequest.
     *
     * @param  CreatePrivateSessionRequestPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return PrivateSessionRequestData
     */
    public function create(\Academorix\SportsPrivateSessionsSdk\Payloads\PrivateSessionRequests\CreatePrivateSessionRequestPayload $payload, ?string $idempotencyKey = null): PrivateSessionRequestData
    {
        return $this->connector->send(new CreatePrivateSessionRequestRequest($payload, $idempotencyKey))->dto();
    }


    /**
     * Show one privatesessionrequest.
     *
     * @param  string  $request                Path parameter — request.
     *
     * @return PrivateSessionRequestData
     */
    public function show(string $request): PrivateSessionRequestData
    {
        return $this->connector->send(new ShowPrivateSessionRequestRequest($request))->dto();
    }
}
