<?php

declare(strict_types=1);

namespace Stackra\PlatformFormsSdk\Requests\Forms;

use Stackra\ApiSdk\Requests\BaseSdkRequest;
use Stackra\PlatformFormsSdk\Data\FormData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/forms/{form}` — show one Form.
 *
 * @category FormsSdk
 *
 * @since    0.1.0
 */
final class ShowFormRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  string       $form                   Path parameter — form.
     */
    public function __construct(
        public readonly string $form,
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
