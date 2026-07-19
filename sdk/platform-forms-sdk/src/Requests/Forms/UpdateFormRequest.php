<?php

declare(strict_types=1);

namespace Academorix\PlatformFormsSdk\Requests\Forms;

use Academorix\ApiSdk\Requests\BaseSdkRequest;
use Academorix\PlatformFormsSdk\Data\FormData;
use Academorix\PlatformFormsSdk\Payloads\Forms\UpdateFormPayload;
use Saloon\Contracts\Body\HasBody;
use Saloon\Enums\Method;
use Saloon\Http\Response;
use Saloon\Traits\Body\HasJsonBody;

/**
 * `PATCH /api/v1/forms/{form}` — update one Form.
 *
 * @category FormsSdk
 *
 * @since    0.1.0
 */
final class UpdateFormRequest extends BaseSdkRequest implements HasBody
{
    use HasJsonBody;

    /**
     * HTTP verb.
     */
    protected Method $method = Method::PATCH;

    /**
     * @param  string       $form                   Path parameter — form.
     * @param  UpdateFormPayload                $payload         Validated payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     */
    public function __construct(
        public readonly string $form,
        public readonly UpdateFormPayload $payload,
        public readonly ?string $idempotencyKey = null,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/forms/' . rawurlencode($this->form);
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
     * {@see FormData}.
     */
    public function createDtoFromResponse(Response $response): FormData
    {
        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        /** @var array<string, mixed> $body */
        $body = isset($payload['data']) && is_array($payload['data'])
            ? $payload['data']
            : $payload;

        return FormData::from($body);
    }
}
