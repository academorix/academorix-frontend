<?php

/**
 * @file apps/stackra/src/sdks/platform-application-sdk/src/Requests/Applications/CreateApplicationRequest.php
 *
 * @description
 * `POST /api/v1/applications` — the **platform-admin** create.
 * Wire body is the caller's {@see CreateApplicationPayload}
 * serialised to snake_case via Spatie Data. Every mutation supports
 * an `Idempotency-Key` header so a retried request never
 * double-writes; when the caller sends the same key twice the
 * server returns the original response.
 */

declare(strict_types=1);

namespace Academorix\PlatformApplicationSdk\Requests\Applications;

use Stackra\ApiSdk\Requests\BaseSdkRequest;
use Academorix\PlatformApplicationSdk\Data\ApplicationData;
use Academorix\PlatformApplicationSdk\Payloads\Applications\CreateApplicationPayload;
use Saloon\Contracts\Body\HasBody;
use Saloon\Enums\Method;
use Saloon\Http\Response;
use Saloon\Traits\Body\HasJsonBody;

/**
 * `POST /api/v1/applications` — create.
 *
 * @category PlatformApplicationSdk
 *
 * @since    0.1.0
 */
final class CreateApplicationRequest extends BaseSdkRequest implements HasBody
{
    use HasJsonBody;

    /**
     * HTTP verb.
     */
    protected Method $method = Method::POST;

    /**
     * @param  CreateApplicationPayload  $payload         The write payload — validated + snake_case-serialised on `toArray()`.
     * @param  string|null               $idempotencyKey  Optional replay-safety token. Server upgrades a retry with the same key into the original response's status + body.
     */
    public function __construct(
        public readonly CreateApplicationPayload $payload,
        public readonly ?string $idempotencyKey = null,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/applications';
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
     * Attach the caller-supplied idempotency key when one was
     * provided. The connector's default headers still merge in
     * (Content-Type, Accept, User-Agent) — this method contributes
     * ONE extra header per request.
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
     * Hydrate the `{ "data": ... }` envelope into an
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
