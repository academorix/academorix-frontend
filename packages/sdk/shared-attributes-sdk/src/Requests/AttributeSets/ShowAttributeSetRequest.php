<?php

declare(strict_types=1);

namespace Stackra\SharedAttributesSdk\Requests\AttributeSets;

use Stackra\ApiSdk\Requests\BaseSdkRequest;
use Stackra\SharedAttributesSdk\Data\AttributeSetData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/attribute-sets/{set}` — show one AttributeSet.
 *
 * @category AttributesSdk
 *
 * @since    0.1.0
 */
final class ShowAttributeSetRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  string       $set                    Path parameter — set.
     */
    public function __construct(
        public readonly string $set,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/attribute-sets/' . rawurlencode($this->set);
    }

    /**
     * Hydrate the `{ "data": ... }` envelope into a
     * {@see AttributeSetData}.
     */
    public function createDtoFromResponse(Response $response): AttributeSetData
    {
        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        /** @var array<string, mixed> $body */
        $body = isset($payload['data']) && is_array($payload['data'])
            ? $payload['data']
            : $payload;

        return AttributeSetData::from($body);
    }
}
