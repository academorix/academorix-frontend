<?php

declare(strict_types=1);

namespace Stackra\Search\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Search\Models\SearchSavedQuery;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a `SearchSavedQuery` row is inserted.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'search.saved_query.created')]
final readonly class SearchSavedQueryCreated implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public SearchSavedQuery $savedQuery)
    {
    }
}
