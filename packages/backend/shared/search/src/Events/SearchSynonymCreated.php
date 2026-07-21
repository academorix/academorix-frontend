<?php

declare(strict_types=1);

namespace Stackra\Search\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Search\Models\SearchSynonym;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a `SearchSynonym` row is inserted.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'search.synonym.created')]
final readonly class SearchSynonymCreated implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public SearchSynonym $synonym)
    {
    }
}
