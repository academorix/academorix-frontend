<?php

declare(strict_types=1);

namespace App\Nightwatch\Filters;

use Stackra\Nightwatch\Attributes\AsNightwatchFilter;
use Stackra\Nightwatch\Contracts\NightwatchFilter;
use Stackra\Nightwatch\Enums\NightwatchEventType;

/**
 * Example: Cache Query Filter.
 *
 * Filters out database queries related to the cache table
 * to reduce noise in Nightwatch.
 */
#[AsNightwatchFilter(NightwatchEventType::Query, description: 'Filters cache table queries')]
class CacheQueryFilter implements NightwatchFilter
{
    public function reject(mixed $record): bool
    {
        return str_contains($record->sql, 'from `cache`')
            || str_contains($record->sql, 'into `cache`');
    }
}
