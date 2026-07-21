<?php

declare(strict_types=1);

namespace Stackra\SharedAttributesSdk\Requests\AttributeDefinitions;

use Stackra\ApiSdk\Requests\BaseSdkRequest;
use Stackra\SharedAttributesSdk\Data\AttributeDefinitionData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/attribute-definitions/{def}` — show one AttributeDefinition.
 *
 * @category AttributesSdk
 *
 * @since    0.1.0
 */
final class ShowAttributeDefinitionRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  string       $def                    Path parameter — def.
     */
    public function __construct(
        public readonly string $def,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/attribute-definitions/' . rawurlencode($this->def);
    }

    /**
     * Hydrate the `{ "data": ... }` envelope into a
     * {@see AttributeDefinitionData}.
     */
    public function createDtoFromResponse(Response $response): AttributeDefinitionData
    {
        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        /** @var array<string, mixed> $body */
        $body = isset($payload['data']) && is_array($payload['data'])
            ? $payload['data']
            : $payload;

        return AttributeDefinitionData::from($body);
    }
}
