<?php

declare(strict_types=1);

namespace Stackra\SharedAttributesSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\SharedAttributesSdk\Data\AttributeGroupData;
use Stackra\SharedAttributesSdk\Requests\AttributeGroups\CreateAttributeGroupRequest;
use Stackra\SharedAttributesSdk\Requests\AttributeGroups\ListAttributeGroupsRequest;
use Stackra\SharedAttributesSdk\Requests\AttributeGroups\UpdateAttributeGroupRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `attribute-groups` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/AttributeGroups/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category AttributesSdk
 *
 * @since    0.1.0
 */
final readonly class AttributeGroupsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every attributegroup.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<AttributeGroupData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListAttributeGroupsRequest($page, $perPage))->dto();
    }


    /**
     * Create a attributegroup.
     *
     * @param  CreateAttributeGroupPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return AttributeGroupData
     */
    public function create(\Stackra\SharedAttributesSdk\Payloads\AttributeGroups\CreateAttributeGroupPayload $payload, ?string $idempotencyKey = null): AttributeGroupData
    {
        return $this->connector->send(new CreateAttributeGroupRequest($payload, $idempotencyKey))->dto();
    }


    /**
     * Update one attributegroup.
     *
     * @param  string  $group                  Path parameter — group.
     * @param  UpdateAttributeGroupPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return AttributeGroupData
     */
    public function update(string $group, \Stackra\SharedAttributesSdk\Payloads\AttributeGroups\UpdateAttributeGroupPayload $payload, ?string $idempotencyKey = null): AttributeGroupData
    {
        return $this->connector->send(new UpdateAttributeGroupRequest($group, $payload, $idempotencyKey))->dto();
    }
}
