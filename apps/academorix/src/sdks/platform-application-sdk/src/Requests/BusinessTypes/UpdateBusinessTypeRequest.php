<?php

/**
 * @file apps/academorix/src/sdks/platform-application-sdk/src/Requests/BusinessTypes/UpdateBusinessTypeRequest.php
 *
 * @description
 * `PATCH /api/v1/business-types/{key}` — the **platform-admin**
 * BusinessType partial update. Body carries only the mutated fields
 * (per spatie/laravel-data's `Optional` sentinel stripping), so an
 * update that touches one field never accidentally clears the
 * others.
 */

declare(strict_types=1);

namespace Academorix\PlatformApplicationSdk\Requests\BusinessTypes;

use Academorix\ApiSdk\Requests\BaseSdkRequest;
use Academorix\PlatformApplicationSdk\Data\BusinessTypeData;
use Academorix\PlatformApplicationSdk\Payloads\BusinessTypes\UpdateBusinessTypePayload;
use Saloon\Contracts\Body\HasBody;
use Saloon\Enums\Method;
use Saloon\Http\Response;
use Saloon\Traits\Body\HasJsonBody;

/**
 * `PATCH /api/v1/business-types/{key}` — partial update.
 *
 * @category PlatformApplicationSdk
 *
 * @since    0.1.0
 */
final class UpdateBusinessTypeRequest extends BaseSdkRequest implements HasBody
{
    use HasJsonBody;

    /**
     * HTTP verb.
     */
    protected Method $method = Method::PATCH;

    /**
     * @param  string                      $key             BusinessType key (`^[a-z][a-z0-9_]*$`). Immutable — refuse to build a request that would try to rename the key.
     * @param  UpdateBusinessTypePayload   $payload         The partial payload — unmentioned fields are omitted from the wire body.
     * @param  string|null                 $idempotencyKey  Optional replay-safety token.
     */
    public function __construct(
        public readonly string $key,
        public readonly UpdateBusinessTypePayload $payload,
        public readonly ?string $idempotencyKey = null,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/business-types/' . rawurlencode($this->key);
    }

    /**
     * Serialise only fields the caller mutated.
     *
     * @return array<string, mixed>
     */
    protected function defaultBody(): array
    {
        return $this->payload->toArray();
    }

    /**
     * Attach the caller-supplied idempotency key when one was
     * provided.
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
     * Hydrate the `{ "data": ... }` envelope into the updated
     * {@see BusinessTypeData}.
     */
    public function createDtoFromResponse(Response $response): BusinessTypeData
    {
        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        /** @var array<string, mixed> $body */
        $body = isset($payload['data']) && is_array($payload['data'])
            ? $payload['data']
            : $payload;

        return BusinessTypeData::from($body);
    }
}
