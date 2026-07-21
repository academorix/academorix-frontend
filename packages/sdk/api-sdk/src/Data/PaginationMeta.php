<?php

/**
 * @file packages/sdk/api-sdk/src/Data/PaginationMeta.php
 *
 * @description
 * The `meta` shape emitted by Laravel's default
 * `LengthAwarePaginator` JSON. Deserialised as part of
 * {@see PaginatedResponse}.
 */

declare(strict_types=1);

namespace Stackra\ApiSdk\Data;

use Spatie\LaravelData\Data;

/**
 * Paginator metadata — page bounds + totals.
 */
final class PaginationMeta extends Data
{
    /**
     * @param  int         $currentPage  1-indexed current page.
     * @param  int         $perPage      Items per page.
     * @param  int         $total        Total items across all pages.
     * @param  int         $lastPage     Index of the last page.
     * @param  int|null    $from         First index on the current page (1-indexed); null on empty page.
     * @param  int|null    $to           Last index on the current page (1-indexed); null on empty page.
     */
    public function __construct(
        public int $currentPage,
        public int $perPage,
        public int $total,
        public int $lastPage,
        public ?int $from = null,
        public ?int $to = null,
    ) {
    }
}
