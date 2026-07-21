<?php

/**
 * @file apps/stackra/src/sdks/platform-application-sdk/src/Requests/BusinessTypes/ShowBusinessTypeRequest.php
 *
 * @description
 * `GET /api/v1/business-types/{key}` — the **platform-admin**
 * BusinessType lookup. `key` is the enum-style token (`academy`,
 * `sports_center`, ...) written to `tenants.business_type`.
 * Server responds `404` when the key doesn't exist in the config
 * catalogue.
 */

declare(strict_types=1);

namespace Stackra\PlatformApplicationSdk\Requests\BusinessTypes;

use Stackra\ApiSdk\Requests\BaseSdkRequest;
use Stackra\PlatformApplicationSdk\Data\BusinessTypeData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/business-types/{key}` — admin lookup.
 *
 * @category PlatformApplicationSdk
 *
 * @since    0.1.0
 */
final class ShowBusinessTypeRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  string     $key                  BusinessType key (`^[a-z][a-z0-9_]*$`).
     * @param  bool|null  $includeTranslations  When `true`, request the full per-locale translation blob.
     */
    public function __construct(
        public readonly string $key,
        public readonly ?bool $includeTranslations = null,
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
     * Serialise the optional `include=translations` toggle.
     *
     * @return array<string, string>
     */
    protected function defaultQuery(): array
    {
        return $this->includeTranslations === true
            ? ['include' => 'translations']
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
