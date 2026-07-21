<?php

declare(strict_types=1);

namespace Stackra\SharedAttributesSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\SharedAttributesSdk\Data\AttributeDefinitionData;
use Stackra\SharedAttributesSdk\Requests\AttributeDefinitions\CreateAttributeDefinitionRequest;
use Stackra\SharedAttributesSdk\Requests\AttributeDefinitions\ListAttributeDefinitionsRequest;
use Stackra\SharedAttributesSdk\Requests\AttributeDefinitions\ShowAttributeDefinitionRequest;
use Stackra\SharedAttributesSdk\Requests\AttributeDefinitions\UpdateAttributeDefinitionRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `attribute-definitions` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/AttributeDefinitions/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category AttributesSdk
 *
 * @since    0.1.0
 */
final readonly class AttributeDefinitionsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every attributedefinition.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<AttributeDefinitionData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListAttributeDefinitionsRequest($page, $perPage))->dto();
    }


    /**
     * Create a attributedefinition.
     *
     * @param  CreateAttributeDefinitionPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return AttributeDefinitionData
     */
    public function create(\Stackra\SharedAttributesSdk\Payloads\AttributeDefinitions\CreateAttributeDefinitionPayload $payload, ?string $idempotencyKey = null): AttributeDefinitionData
    {
        return $this->connector->send(new CreateAttributeDefinitionRequest($payload, $idempotencyKey))->dto();
    }


    /**
     * Show one attributedefinition.
     *
     * @param  string  $def                    Path parameter — def.
     *
     * @return AttributeDefinitionData
     */
    public function show(string $def): AttributeDefinitionData
    {
        return $this->connector->send(new ShowAttributeDefinitionRequest($def))->dto();
    }


    /**
     * Update one attributedefinition.
     *
     * @param  string  $def                    Path parameter — def.
     * @param  UpdateAttributeDefinitionPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return AttributeDefinitionData
     */
    public function update(string $def, \Stackra\SharedAttributesSdk\Payloads\AttributeDefinitions\UpdateAttributeDefinitionPayload $payload, ?string $idempotencyKey = null): AttributeDefinitionData
    {
        return $this->connector->send(new UpdateAttributeDefinitionRequest($def, $payload, $idempotencyKey))->dto();
    }
}
