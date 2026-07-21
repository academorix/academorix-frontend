<?php

/**
 * @file packages/sdk/api-sdk/src/Data/PaginationLinks.php
 *
 * @description
 * The `links` shape emitted by Laravel's default
 * `LengthAwarePaginator` JSON. All fields are optional strings —
 * the API omits keys when the corresponding page doesn't exist
 * (e.g. `prev` on page 1, `next` on the last page).
 */

declare(strict_types=1);

namespace Stackra\ApiSdk\Data;

use Spatie\LaravelData\Data;

/**
 * Paginator link URLs.
 */
final class PaginationLinks extends Data
{
    /**
     * @param  string|null  $first  URL of page 1.
     * @param  string|null  $last   URL of the last page.
     * @param  string|null  $prev   URL of the previous page; null on page 1.
     * @param  string|null  $next   URL of the next page; null on the last page.
     */
    public function __construct(
        public ?string $first = null,
        public ?string $last = null,
        public ?string $prev = null,
        public ?string $next = null,
    ) {
    }
}
