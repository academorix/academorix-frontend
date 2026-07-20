<?php

/**
 * @file apps/academorix/src/sdks/platform-application-sdk/src/Requests/Applications/ListApplicationsRequest.php
 *
 * @description
 * `GET /api/v1/applications` — the **central** (public) audience.
 * Emits the discoverable set of Applications the marketing surface
 * needs; no auth required. The Platform service filters
 * `deleted_at IS NULL` and `is_active` server-side. Response is a
 * paginated envelope
 * (`{ data: ApplicationData[], meta: {...}, links: {...} }`).
 */

declare(strict_types=1);

namespace Academorix\PlatformApplicationSdk\Requests\Applications;

use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\ApiSdk\Data\PaginationLinks;
use Academorix\ApiSdk\Data\PaginationMeta;
use Academorix\ApiSdk\Requests\BaseSdkRequest;
use Academorix\PlatformApplicationSdk\Data\ApplicationData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/applications` — public list (central audience).
 *
 * @category PlatformApplicationSdk
 *
 * @since    0.1.0
 */
final class ListApplicationsRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  int|null  $page     1-indexed page number; server default = 1.
     * @param  int|null  $perPage  Items per page; server default = 15.
     */
    public function __construct(
        public readonly ?int $page = null,
        public readonly ?int $perPage = null,
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
     * Serialise the optional pagination knobs into the query string.
     * Saloon merges this into the built URL — `null` values are
     * dropped, matching Laravel's paginator defaults.
     *
     * @return array<string, int>
     */
    protected function defaultQuery(): array
    {
        // Rebuild the query lazily so a `null` page + non-null perPage
        // still emits `?per_page=25` without a stray `page=` key.
        $q = [];
        if ($this->page !== null) {
            $q['page'] = $this->page;
        }
        if ($this->perPage !== null) {
            $q['per_page'] = $this->perPage;
        }

        return $q;
    }

    /**
     * Hydrate the paginated envelope into
     * `PaginatedResponse<ApplicationData>`.
     *
     * @return PaginatedResponse<ApplicationData>
     */
    public function createDtoFromResponse(Response $response): PaginatedResponse
    {
        /** @var array{data?: list<array<string, mixed>>, meta?: array<string, mixed>, links?: array<string, mixed>|null} $payload */
        $payload = $response->json();

        // The wire always carries `data` on paginated responses; fall
        // back to the whole payload only if the server accidentally
        // dropped the envelope (should never happen in practice).
        /** @var list<array<string, mixed>> $items */
        $items = $payload['data'] ?? [];
        /** @var array<string, mixed> $meta */
        $meta = $payload['meta'] ?? [];
        /** @var array<string, mixed>|null $links */
        $links = $payload['links'] ?? null;

        return new PaginatedResponse(
            data: array_map(
                static fn (array $row): ApplicationData => ApplicationData::from($row),
                $items,
            ),
            meta: PaginationMeta::from($meta),
            links: $links !== null ? PaginationLinks::from($links) : null,
        );
    }
}
