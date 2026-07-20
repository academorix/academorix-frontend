<?php

declare(strict_types=1);

namespace Academorix\SharedAttributesSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\SharedAttributesSdk\Data\AttributeSetData;
use Academorix\SharedAttributesSdk\Requests\AttributeSets\CreateAttributeSetRequest;
use Academorix\SharedAttributesSdk\Requests\AttributeSets\ListAttributeSetsAdminRequest;
use Academorix\SharedAttributesSdk\Requests\AttributeSets\ListAttributeSetsRequest;
use Academorix\SharedAttributesSdk\Requests\AttributeSets\ShowAttributeSetAdminRequest;
use Academorix\SharedAttributesSdk\Requests\AttributeSets\ShowAttributeSetRequest;
use Academorix\SharedAttributesSdk\Requests\AttributeSets\UpdateAttributeSetRequest;
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
    public function create(\Academorix\SharedAttributesSdk\Payloads\AttributeSets\CreateAttributeSetPayload $payload, ?string $idempotencyKey = null): AttributeSetData
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
    public function update(string $set, \Academorix\SharedAttributesSdk\Payloads\AttributeSets\UpdateAttributeSetPayload $payload, ?string $idempotencyKey = null): AttributeSetData
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
