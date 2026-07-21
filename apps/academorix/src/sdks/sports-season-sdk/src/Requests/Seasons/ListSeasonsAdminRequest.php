<?php

declare(strict_types=1);

namespace Stackra\SportsSeasonSdk\Requests\Seasons;

use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\ApiSdk\Data\PaginationLinks;
use Stackra\ApiSdk\Data\PaginationMeta;
use Stackra\ApiSdk\Requests\BaseSdkRequest;
use Stackra\SportsSeasonSdk\Data\SeasonData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/platform/seasons` — list every Season.
 *
 * @category SeasonSdk
 *
 * @since    0.1.0
 */
final class ListSeasonsAdminRequest extends BaseSdkRequest
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
        return '/api/v1/platform/seasons';
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
     * `PaginatedResponse<SeasonData>`.
     *
     * @return PaginatedResponse<SeasonData>
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
                static fn (array $row): SeasonData => SeasonData::from($row),
                $items,
            ),
            meta: PaginationMeta::from($meta),
            links: $links !== null ? PaginationLinks::from($links) : null,
        );
    }
}
