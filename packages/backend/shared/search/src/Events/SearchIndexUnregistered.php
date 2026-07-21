<?php

declare(strict_types=1);

namespace Stackra\Search\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Search\Models\SearchIndex;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a `SearchIndex` row is soft-deleted.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'search.index.unregistered')]
final readonly class SearchIndexUnregistered implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public SearchIndex $index)
    {
    }
}
