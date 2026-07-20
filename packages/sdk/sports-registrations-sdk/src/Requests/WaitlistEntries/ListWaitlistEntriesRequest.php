<?php

declare(strict_types=1);

namespace Academorix\SportsRegistrationsSdk\Requests\WaitlistEntries;

use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\ApiSdk\Data\PaginationLinks;
use Academorix\ApiSdk\Data\PaginationMeta;
use Academorix\ApiSdk\Requests\BaseSdkRequest;
use Academorix\SportsRegistrationsSdk\Data\WaitlistEntryData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/waitlist-entries` — list every WaitlistEntry.
 *
 * @category RegistrationsSdk
 *
 * @since    0.1.0
 */
final class ListWaitlistEntriesRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  int|null     $page            1-indexed page number.
     * @param  int|null     $perPage         Items per page.
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
        return '/api/v1/waitlist-entries';
    }

    /**
     * Emit pagination knobs into the query string.
     *
     * @return array<string, int>
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
        return $q;
    }

    /**
     * Hydrate the paginated envelope into
     * `PaginatedResponse<WaitlistEntryData>`.
     *
     * @return PaginatedResponse<WaitlistEntryData>
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
                static fn (array $row): WaitlistEntryData => WaitlistEntryData::from($row),
                $items,
            ),
            meta: PaginationMeta::from($meta),
            links: $links !== null ? PaginationLinks::from($links) : null,
        );
    }
}
