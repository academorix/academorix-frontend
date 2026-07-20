<?php

declare(strict_types=1);

namespace Academorix\PlatformPublicSiteSdk\Requests\PublicPages;

use Academorix\ApiSdk\Requests\BaseSdkRequest;
use Academorix\PlatformPublicSiteSdk\Data\PublicPageData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/public-pages/{page}` — show one PublicPage.
 *
 * @category PublicSiteSdk
 *
 * @since    0.1.0
 */
final class ShowPublicPageRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  string       $page                   Path parameter — page.
     */
    public function __construct(
        public readonly string $page,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/public-pages/' . rawurlencode($this->page);
    }

    /**
     * Hydrate the `{ "data": ... }` envelope into a
     * {@see PublicPageData}.
     */
    public function createDtoFromResponse(Response $response): PublicPageData
    {
        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        /** @var array<string, mixed> $body */
        $body = isset($payload['data']) && is_array($payload['data'])
            ? $payload['data']
            : $payload;

        return PublicPageData::from($body);
    }
}
