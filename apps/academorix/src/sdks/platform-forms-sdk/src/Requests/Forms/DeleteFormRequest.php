<?php

declare(strict_types=1);

namespace Stackra\PlatformFormsSdk\Requests\Forms;

use Stackra\ApiSdk\Requests\BaseSdkRequest;
use Stackra\PlatformFormsSdk\Data\FormData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `DELETE /api/v1/forms/{form}` — delete one Form.
 *
 * @category FormsSdk
 *
 * @since    0.1.0
 */
final class DeleteFormRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::DELETE;

    /**
     * @param  string       $form                   Path parameter — form.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     */
    public function __construct(
        public readonly string $form,
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
     * Delete returns 204 No Content — no DTO to hydrate.
     */
    public function createDtoFromResponse(Response $response): null
    {
        return null;
    }
}
