<?php

/**
 * @file packages/sdk/platform-application-sdk/src/Requests/Applications/ShowApplicationRequest.php
 *
 * @description
 * `GET /api/v1/applications/{slug}` — the **central** (public)
 * lookup. Callers pass the URL-safe slug (`sports`, `education`).
 * Returns `404` when the slug matches no active Application.
 */

declare(strict_types=1);

namespace Academorix\PlatformApplicationSdk\Requests\Applications;

use Academorix\ApiSdk\Requests\BaseSdkRequest;
use Academorix\PlatformApplicationSdk\Data\ApplicationData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/applications/{slug}` — public lookup by slug.
 *
 * @category PlatformApplicationSdk
 *
 * @since    0.1.0
 */
final class ShowApplicationRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  string  $slug  URL-safe application identifier; MUST match `^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$` — the server 404s on invalid shapes rather than returning 422 so the same URL either resolves or doesn't.
     */
    public function __construct(
        public readonly string $slug,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     * `rawurlencode()` guards against caller-controlled slug values
     * that contain reserved characters — even though the server
     * refuses them anyway, encoding here means a caller-side bug
     * yields a clean 404 rather than a malformed URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/applications/' . rawurlencode($this->slug);
    }

    /**
     * Hydrate the `{ "data": ... }` envelope into an
     * {@see ApplicationData}. Unwraps the envelope when present and
     * falls back to the whole payload when the server drops it.
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
