<?php

/**
 * @file packages/sdk/platform-application-sdk/src/Requests/BusinessTypes/CreateBusinessTypeRequest.php
 *
 * @description
 * `POST /api/v1/business-types` — the **platform-admin**
 * BusinessType create. Extends the config-backed catalogue at
 * runtime; the Platform service writes the new entry into
 * `data/business-types.json` + `config/workspaces.php` and
 * hot-reloads it into the resolver cache.
 */

declare(strict_types=1);

namespace Stackra\PlatformApplicationSdk\Requests\BusinessTypes;

use Stackra\ApiSdk\Requests\BaseSdkRequest;
use Stackra\PlatformApplicationSdk\Data\BusinessTypeData;
use Stackra\PlatformApplicationSdk\Payloads\BusinessTypes\CreateBusinessTypePayload;
use Saloon\Contracts\Body\HasBody;
use Saloon\Enums\Method;
use Saloon\Http\Response;
use Saloon\Traits\Body\HasJsonBody;

/**
 * `POST /api/v1/business-types` — create.
 *
 * @category PlatformApplicationSdk
 *
 * @since    0.1.0
 */
final class CreateBusinessTypeRequest extends BaseSdkRequest implements HasBody
{
    use HasJsonBody;

    /**
     * HTTP verb.
     */
    protected Method $method = Method::POST;

    /**
     * @param  CreateBusinessTypePayload  $payload         The write payload — validated + snake_case-serialised on `toArray()`.
     * @param  string|null                $idempotencyKey  Optional replay-safety token.
     */
    public function __construct(
        public readonly CreateBusinessTypePayload $payload,
        public readonly ?string $idempotencyKey = null,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/business-types';
    }

    /**
     * Serialise the payload into the JSON body.
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
     * Hydrate the `{ "data": ... }` envelope into a
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
