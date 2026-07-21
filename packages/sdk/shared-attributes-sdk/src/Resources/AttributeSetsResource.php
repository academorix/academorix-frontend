<?php

declare(strict_types=1);

namespace Stackra\SharedAttributesSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\SharedAttributesSdk\Data\AttributeSetData;
use Stackra\SharedAttributesSdk\Requests\AttributeSets\CreateAttributeSetRequest;
use Stackra\SharedAttributesSdk\Requests\AttributeSets\ListAttributeSetsAdminRequest;
use Stackra\SharedAttributesSdk\Requests\AttributeSets\ListAttributeSetsRequest;
use Stackra\SharedAttributesSdk\Requests\AttributeSets\ShowAttributeSetAdminRequest;
use Stackra\SharedAttributesSdk\Requests\AttributeSets\ShowAttributeSetRequest;
use Stackra\SharedAttributesSdk\Requests\AttributeSets\UpdateAttributeSetRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `attribute-sets` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/AttributeSets/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category AttributesSdk
 *
 * @since    0.1.0
 */
final readonly class AttributeSetsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every attributeset.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<AttributeSetData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListAttributeSetsRequest($page, $perPage))->dto();
    }


    /**
     * Create a attributeset.
     *
     * @param  CreateAttributeSetPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return AttributeSetData
     */
    public function create(\Stackra\SharedAttributesSdk\Payloads\AttributeSets\CreateAttributeSetPayload $payload, ?string $idempotencyKey = null): AttributeSetData
    {
        return $this->connector->send(new CreateAttributeSetRequest($payload, $idempotencyKey))->dto();
    }


    /**
     * Show one attributeset.
     *
     * @param  string  $set                    Path parameter — set.
     *
     * @return AttributeSetData
     */
    public function show(string $set): AttributeSetData
    {
        return $this->connector->send(new ShowAttributeSetRequest($set))->dto();
    }


    /**
     * Update one attributeset.
     *
     * @param  string  $set                    Path parameter — set.
     * @param  UpdateAttributeSetPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return AttributeSetData
     */
    public function update(string $set, \Stackra\SharedAttributesSdk\Payloads\AttributeSets\UpdateAttributeSetPayload $payload, ?string $idempotencyKey = null): AttributeSetData
    {
        return $this->connector->send(new UpdateAttributeSetRequest($set, $payload, $idempotencyKey))->dto();
    }


    /**
     * List every attributeset.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<AttributeSetData>
     */
    public function listAdmin(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListAttributeSetsAdminRequest($page, $perPage))->dto();
    }


    /**
     * Show one attributeset.
     *
     * @param  string  $set                    Path parameter — set.
     *
     * @return AttributeSetData
     */
    public function showAdmin(string $set): AttributeSetData
    {
        return $this->connector->send(new ShowAttributeSetAdminRequest($set))->dto();
    }
}
