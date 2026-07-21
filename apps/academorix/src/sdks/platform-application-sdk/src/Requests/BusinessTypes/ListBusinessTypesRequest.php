<?php

/**
 * @file apps/stackra/src/sdks/platform-application-sdk/src/Requests/BusinessTypes/ListBusinessTypesRequest.php
 *
 * @description
 * `GET /api/v1/business-types` — the **platform-admin** BusinessType
 * catalogue list. The catalogue is config-backed (not an Eloquent
 * table), so pagination is a client-side kindness rather than a
 * server-side pager; the server returns the full catalogue if the
 * caller omits `page` / `per_page` and it fits under a small cap.
 */

declare(strict_types=1);

namespace Stackra\PlatformApplicationSdk\Requests\BusinessTypes;

use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\ApiSdk\Data\PaginationLinks;
use Stackra\ApiSdk\Data\PaginationMeta;
use Stackra\ApiSdk\Requests\BaseSdkRequest;
use Stackra\PlatformApplicationSdk\Data\BusinessTypeData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/business-types` — admin list.
 *
 * @category PlatformApplicationSdk
 *
 * @since    0.1.0
 */
final class ListBusinessTypesRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  int|null   $page               1-indexed page number; server default = 1.
     * @param  int|null   $perPage            Items per page; server default = 25.
     * @param  bool|null  $includeTranslations When `true`, request the full per-locale translation blob on every entry.
     * @param  bool|null  $onlyVisible        When `true`, filter out `is_visible = false` entries.
     */
    public function __construct(
        public readonly ?int $page = null,
        public readonly ?int $perPage = null,
        public readonly ?bool $includeTranslations = null,
        public readonly ?bool $onlyVisible = null,
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
     * Serialise the optional pagination + include knobs into the
     * query string. `include=translations` matches the schema
     * annotation on `x-translatable.wire_convention`.
     *
     * @return array<string, int|string>
     */
    protected function defaultQuery(): array
    {
        $q = [];
        if ($this->page !== null) {
            $q['page'] = $this->page;
        }
        if ($this->perPage !== null) {
            $q['per_page'] = $this->perPage;
        }
        if ($this->includeTranslations === true) {
            // The schema pins this contract as `?include=translations`.
            // See `x-translatable.wire_convention` on the BusinessType
            // schema.
            $q['include'] = 'translations';
        }
        if ($this->onlyVisible === true) {
            $q['only_visible'] = 1;
        }

        return $q;
    }

    /**
     * Hydrate the paginated envelope into
     * `PaginatedResponse<BusinessTypeData>`.
     *
     * @return PaginatedResponse<BusinessTypeData>
     */
    public function createDtoFromResponse(Response $response): PaginatedResponse
    {
        /** @var array{data?: list<array<string, mixed>>, meta?: array<string, mixed>, links?: array<string, mixed>|null} $payload */
        $payload = $response->json();
        /** @var list<array<string, mixed>> $items */
        $items = $payload['data'] ?? [];
        /** @var array<string, mixed> $meta */
        $meta = $payload['meta'] ?? [];
        /** @var array<string, mixed>|null $links */
        $links = $payload['links'] ?? null;

        return new PaginatedResponse(
            data: array_map(
                static fn (array $row): BusinessTypeData => BusinessTypeData::from($row),
                $items,
            ),
            meta: PaginationMeta::from($meta),
            links: $links !== null ? PaginationLinks::from($links) : null,
        );
    }
}
