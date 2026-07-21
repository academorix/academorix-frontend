<?php

declare(strict_types=1);

namespace Stackra\PlatformCredentialsSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\PlatformCredentialsSdk\Data\GateData;
use Stackra\PlatformCredentialsSdk\Requests\Gates\CreateGateRequest;
use Stackra\PlatformCredentialsSdk\Requests\Gates\ListGatesAdminRequest;
use Stackra\PlatformCredentialsSdk\Requests\Gates\ListGatesRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `gates` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/Gates/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category CredentialsSdk
 *
 * @since    0.1.0
 */
final readonly class GatesResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every gate.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<GateData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListGatesRequest($page, $perPage))->dto();
    }


    /**
     * Create a gate.
     *
     * @param  CreateGatePayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return GateData
     */
    public function create(\Stackra\PlatformCredentialsSdk\Payloads\Gates\CreateGatePayload $payload, ?string $idempotencyKey = null): GateData
    {
        return $this->connector->send(new CreateGateRequest($payload, $idempotencyKey))->dto();
    }


    /**
     * List every gate.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<GateData>
     */
    public function listAdmin(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListGatesAdminRequest($page, $perPage))->dto();
    }
}
