<?php

/**
 * @file apps/stackra/src/sdks/platform-application-sdk/src/Requests/Applications/UpdateApplicationRequest.php
 *
 * @description
 * `PATCH /api/v1/applications/{id}` — the **platform-admin** update.
 * Body is the caller's {@see UpdateApplicationPayload} serialised via
 * Spatie Data. Every property on the payload is `Optional` by
 * default; `toArray()` strips the sentinels so the wire only carries
 * fields the caller explicitly mutated (never overwriting the server
 * with unmentioned columns).
 */

declare(strict_types=1);

namespace Academorix\PlatformApplicationSdk\Requests\Applications;

use Stackra\ApiSdk\Requests\BaseSdkRequest;
use Academorix\PlatformApplicationSdk\Data\ApplicationData;
use Academorix\PlatformApplicationSdk\Payloads\Applications\UpdateApplicationPayload;
use Saloon\Contracts\Body\HasBody;
use Saloon\Enums\Method;
use Saloon\Http\Response;
use Saloon\Traits\Body\HasJsonBody;

/**
 * `PATCH /api/v1/applications/{id}` — partial update.
 *
 * @category PlatformApplicationSdk
 *
 * @since    0.1.0
 */
final class UpdateApplicationRequest extends BaseSdkRequest implements HasBody
{
    use HasJsonBody;

    /**
     * HTTP verb.
     */
    protected Method $method = Method::PATCH;

    /**
     * @param  string                     $id              Prefixed ULID (`app_<26 chars>`).
     * @param  UpdateApplicationPayload   $payload         Partial-update payload; unmentioned fields are omitted from the wire body.
     * @param  string|null                $idempotencyKey  Optional replay-safety token.
     */
    public function __construct(
        public readonly string $id,
        public readonly UpdateApplicationPayload $payload,
        public readonly ?string $idempotencyKey = null,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/applications/' . rawurlencode($this->id);
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
     * {@see ApplicationData}.
     */
    public function createDtoFromResponse(Response $response): ApplicationData
    {
        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        /** @var array<string, mixed> $body */
        $body = isset($payload['data']) && is_array($payload['data'])
            ? $payload['data']
            : $payload;

        return ApplicationData::from($body);
    }
}
