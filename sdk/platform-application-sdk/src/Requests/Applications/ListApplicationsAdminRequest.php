<?php

/**
 * @file packages/sdk/platform-application-sdk/src/Requests/Applications/ListApplicationsAdminRequest.php
 *
 * @description
 * `GET /api/v1/applications` — the **platform-admin** audience. Auth
 * required (Sanctum PAT via `Authorization: Bearer <token>`; the
 * connector attaches it). The response shape matches the central
 * variant but the server includes soft-deleted rows when the caller
 * has the corresponding permission. Kept as a separate class so
 * IDEs + typing stays honest: the two endpoints have distinct
 * authorization requirements even when the URL is textually equal.
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
 * `GET /api/v1/applications` — admin list (platform-admin audience).
 *
 * @category PlatformApplicationSdk
 *
 * @since    0.1.0
 */
final class ListApplicationsAdminRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  int|null   $page             1-indexed page number; server default = 1.
     * @param  int|null   $perPage          Items per page; server default = 15.
     * @param  bool|null  $withTrashed      When `true`, include soft-deleted Applications. Server-side permission gate `application.viewTrashed`.
     */
    public function __construct(
        public readonly ?int $page = null,
        public readonly ?int $perPage = null,
        public readonly ?bool $withTrashed = null,
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
     * Serialise the optional pagination + trashed-inclusion knobs
     * into the query string.
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
        if ($this->withTrashed === true) {
            // Server reads `with_trashed=1` — the boolean-to-int
            // conversion here matches how spatie/laravel-query-builder
            // decodes boolean filters.
            $q['with_trashed'] = 1;
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
