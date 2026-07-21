<?php

declare(strict_types=1);

namespace Stackra\PlatformCredentialsSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\PlatformCredentialsSdk\Data\CredentialData;
use Stackra\PlatformCredentialsSdk\Requests\Credentials\CreateCredentialRequest;
use Stackra\PlatformCredentialsSdk\Requests\Credentials\ListCredentialsAdminRequest;
use Stackra\PlatformCredentialsSdk\Requests\Credentials\ListCredentialsRequest;
use Stackra\PlatformCredentialsSdk\Requests\Credentials\ShowCredentialRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `credentials` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/Credentials/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category CredentialsSdk
 *
 * @since    0.1.0
 */
final readonly class CredentialsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every credential.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<CredentialData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListCredentialsRequest($page, $perPage))->dto();
    }


    /**
     * Create a credential.
     *
     * @param  CreateCredentialPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return CredentialData
     */
    public function create(\Stackra\PlatformCredentialsSdk\Payloads\Credentials\CreateCredentialPayload $payload, ?string $idempotencyKey = null): CredentialData
    {
        return $this->connector->send(new CreateCredentialRequest($payload, $idempotencyKey))->dto();
    }


    /**
     * Show one credential.
     *
     * @param  string  $credential             Path parameter — credential.
     *
     * @return CredentialData
     */
    public function show(string $credential): CredentialData
    {
        return $this->connector->send(new ShowCredentialRequest($credential))->dto();
    }


    /**
     * List every credential.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<CredentialData>
     */
    public function listAdmin(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListCredentialsAdminRequest($page, $perPage))->dto();
    }
}
