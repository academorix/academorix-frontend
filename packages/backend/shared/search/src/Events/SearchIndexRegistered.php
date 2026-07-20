<?php

declare(strict_types=1);

namespace Academorix\Search\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Search\Models\SearchIndex;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a `#[Searchable]` model class is newly registered.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'search.index.registered')]
final readonly class SearchIndexRegistered implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public SearchIndex $index)
    {
    }
}
