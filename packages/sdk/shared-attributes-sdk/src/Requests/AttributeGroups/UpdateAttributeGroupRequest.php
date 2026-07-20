<?php

declare(strict_types=1);

namespace Academorix\SharedAttributesSdk\Requests\AttributeGroups;

use Academorix\ApiSdk\Requests\BaseSdkRequest;
use Academorix\SharedAttributesSdk\Data\AttributeGroupData;
use Academorix\SharedAttributesSdk\Payloads\AttributeGroups\UpdateAttributeGroupPayload;
use Saloon\Contracts\Body\HasBody;
use Saloon\Enums\Method;
use Saloon\Http\Response;
use Saloon\Traits\Body\HasJsonBody;

/**
 * `PATCH /api/v1/attribute-groups/{group}` — update one AttributeGroup.
 *
 * @category AttributesSdk
 *
 * @since    0.1.0
 */
final class UpdateAttributeGroupRequest extends BaseSdkRequest implements HasBody
{
    use HasJsonBody;

    /**
     * HTTP verb.
     */
    protected Method $method = Method::PATCH;

    /**
     * @param  string       $group                  Path parameter — group.
     * @param  UpdateAttributeGroupPayload      $payload         Validated payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     */
    public function __construct(
        public readonly string $group,
        public readonly UpdateAttributeGroupPayload $payload,
        public readonly ?string $idempotencyKey = null,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/attribute-groups/' . rawurlencode($this->group);
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
     * {@see AttributeGroupData}.
     */
    public function createDtoFromResponse(Response $response): AttributeGroupData
    {
        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        /** @var array<string, mixed> $body */
        $body = isset($payload['data']) && is_array($payload['data'])
            ? $payload['data']
            : $payload;

        return AttributeGroupData::from($body);
    }
}
