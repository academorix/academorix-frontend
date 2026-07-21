<?php

declare(strict_types=1);

namespace Stackra\PlatformSafeguardingSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\PlatformSafeguardingSdk\Data\BackgroundCheckData;
use Stackra\PlatformSafeguardingSdk\Requests\BackgroundChecks\CreateBackgroundCheckRequest;
use Stackra\PlatformSafeguardingSdk\Requests\BackgroundChecks\ListBackgroundChecksAdminRequest;
use Stackra\PlatformSafeguardingSdk\Requests\BackgroundChecks\ListBackgroundChecksRequest;
use Stackra\PlatformSafeguardingSdk\Requests\BackgroundChecks\ShowBackgroundCheckRequest;
use Stackra\PlatformSafeguardingSdk\Requests\BackgroundChecks\UpdateBackgroundCheckRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `background-checks` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/BackgroundChecks/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category SafeguardingSdk
 *
 * @since    0.1.0
 */
final readonly class BackgroundChecksResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every backgroundcheck.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<BackgroundCheckData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListBackgroundChecksRequest($page, $perPage))->dto();
    }


    /**
     * Create a backgroundcheck.
     *
     * @param  CreateBackgroundCheckPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return BackgroundCheckData
     */
    public function create(\Stackra\PlatformSafeguardingSdk\Payloads\BackgroundChecks\CreateBackgroundCheckPayload $payload, ?string $idempotencyKey = null): BackgroundCheckData
    {
        return $this->connector->send(new CreateBackgroundCheckRequest($payload, $idempotencyKey))->dto();
    }


    /**
     * Show one backgroundcheck.
     *
     * @param  string  $check                  Path parameter — check.
     *
     * @return BackgroundCheckData
     */
    public function show(string $check): BackgroundCheckData
    {
        return $this->connector->send(new ShowBackgroundCheckRequest($check))->dto();
    }


    /**
     * Update one backgroundcheck.
     *
     * @param  string  $check                  Path parameter — check.
     * @param  UpdateBackgroundCheckPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return BackgroundCheckData
     */
    public function update(string $check, \Stackra\PlatformSafeguardingSdk\Payloads\BackgroundChecks\UpdateBackgroundCheckPayload $payload, ?string $idempotencyKey = null): BackgroundCheckData
    {
        return $this->connector->send(new UpdateBackgroundCheckRequest($check, $payload, $idempotencyKey))->dto();
    }


    /**
     * List every backgroundcheck.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<BackgroundCheckData>
     */
    public function listAdmin(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListBackgroundChecksAdminRequest($page, $perPage))->dto();
    }
}
