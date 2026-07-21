<?php

declare(strict_types=1);

namespace Stackra\SharedAttributesSdk\Requests\AttributeDefinitions;

use Stackra\ApiSdk\Requests\BaseSdkRequest;
use Stackra\SharedAttributesSdk\Data\AttributeDefinitionData;
use Stackra\SharedAttributesSdk\Payloads\AttributeDefinitions\UpdateAttributeDefinitionPayload;
use Saloon\Contracts\Body\HasBody;
use Saloon\Enums\Method;
use Saloon\Http\Response;
use Saloon\Traits\Body\HasJsonBody;

/**
 * `PATCH /api/v1/attribute-definitions/{def}` — update one AttributeDefinition.
 *
 * @category AttributesSdk
 *
 * @since    0.1.0
 */
final class UpdateAttributeDefinitionRequest extends BaseSdkRequest implements HasBody
{
    use HasJsonBody;

    /**
     * HTTP verb.
     */
    protected Method $method = Method::PATCH;

    /**
     * @param  string       $def                    Path parameter — def.
     * @param  UpdateAttributeDefinitionPayload $payload         Validated payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     */
    public function __construct(
        public readonly string $def,
        public readonly UpdateAttributeDefinitionPayload $payload,
        public readonly ?string $idempotencyKey = null,
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
     * Serialise the payload into the JSON body. Spatie Data's
     * `toArray()` strips any `Optional` sentinel values, so the
     * server only sees fields the caller explicitly set.
     *
     * @return array<string, mixed>
     */
    protected function defaultBody(): array
    {
        return $this->payload->toArray();
    }

    /**
     * Attach the caller-supplied idempotency key when one was provided.
     *
     * @return array<string, string>
     */
    protected function defaultHeaders(): array
    {
        return $this->idempotencyKey !== null
            ? ['Idempotency-Key' => $this->idempotencyKey]
            : [];
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
