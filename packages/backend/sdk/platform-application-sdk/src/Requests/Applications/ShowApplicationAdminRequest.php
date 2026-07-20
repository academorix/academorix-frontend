<?php

/**
 * @file packages/sdk/platform-application-sdk/src/Requests/Applications/ShowApplicationAdminRequest.php
 *
 * @description
 * `GET /api/v1/applications/{id}` — the **platform-admin** lookup.
 * Callers pass the prefixed ULID (`app_<26 chars>`), NOT the slug —
 * platform admins operate on the primary key so soft-deleted rows
 * are addressable. The slug-driven route lives on the central
 * audience ({@see ShowApplicationRequest}).
 */

declare(strict_types=1);

namespace Academorix\PlatformApplicationSdk\Requests\Applications;

use Academorix\ApiSdk\Requests\BaseSdkRequest;
use Academorix\PlatformApplicationSdk\Data\ApplicationData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/applications/{id}` — admin lookup by ULID.
 *
 * @category PlatformApplicationSdk
 *
 * @since    0.1.0
 */
final class ShowApplicationAdminRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  string  $id  Prefixed ULID (`app_<26 chars>`). Server 404s on unknown IDs; 422 on malformed IDs.
     */
    public function __construct(
        public readonly string $id,
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
