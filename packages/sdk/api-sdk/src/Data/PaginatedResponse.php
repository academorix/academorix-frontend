<?php

/**
 * @file packages/sdk/api-sdk/src/Data/PaginatedResponse.php
 *
 * @description
 * Generic wrapper for paginated list responses. Every SDK list
 * endpoint that talks to a Laravel `LengthAwarePaginator` return
 * shape can be deserialised into this DTO.
 *
 * ## Wire shape (Laravel default)
 *
 * ```json
 * {
 *   "data": [ ... ],
 *   "links": { "first": ..., "last": ..., "prev": ..., "next": ... },
 *   "meta":  { "current_page": 1, "from": 1, "last_page": 5, "per_page": 15, "to": 15, "total": 73 }
 * }
 * ```
 *
 * ## Generics
 *
 * The `$data` property is `list<TItem>` — the concrete item
 * class is determined by the request's `createDtoFromResponse`.
 * Consumers get IDE completion by declaring the return type on
 * their resource method:
 *
 * ```php
 * // @return PaginatedResponse<TenantData>
 * public function list(ListTenantsParams $params): PaginatedResponse
 * ```
 *
 * @template TItem of object
 */

declare(strict_types=1);

namespace Academorix\ApiSdk\Data;

use Spatie\LaravelData\Data;

/**
 * DTO wrapping a Laravel paginator response.
 *
 * @template TItem of object
 */
class PaginatedResponse extends Data
{
    /**
     * @param  list<TItem>                      $data   The page's items — instantiated by the concrete request.
     * @param  PaginationMeta                   $meta   Page + total counts.
     * @param  PaginationLinks|null             $links  First / last / prev / next URLs, when the API emits them.
     */
    public function __construct(
        public array $data,
        public PaginationMeta $meta,
        public ?PaginationLinks $links = null,
    ) {
    }
}
