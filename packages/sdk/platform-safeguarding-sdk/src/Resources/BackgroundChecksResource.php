<?php

declare(strict_types=1);

namespace Academorix\PlatformSafeguardingSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\PlatformSafeguardingSdk\Data\BackgroundCheckData;
use Academorix\PlatformSafeguardingSdk\Requests\BackgroundChecks\CreateBackgroundCheckRequest;
use Academorix\PlatformSafeguardingSdk\Requests\BackgroundChecks\ListBackgroundChecksAdminRequest;
use Academorix\PlatformSafeguardingSdk\Requests\BackgroundChecks\ListBackgroundChecksRequest;
use Academorix\PlatformSafeguardingSdk\Requests\BackgroundChecks\ShowBackgroundCheckRequest;
use Academorix\PlatformSafeguardingSdk\Requests\BackgroundChecks\UpdateBackgroundCheckRequest;
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
    public function create(\Academorix\PlatformSafeguardingSdk\Payloads\BackgroundChecks\CreateBackgroundCheckPayload $payload, ?string $idempotencyKey = null): BackgroundCheckData
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
    public function update(string $check, \Academorix\PlatformSafeguardingSdk\Payloads\BackgroundChecks\UpdateBackgroundCheckPayload $payload, ?string $idempotencyKey = null): BackgroundCheckData
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
