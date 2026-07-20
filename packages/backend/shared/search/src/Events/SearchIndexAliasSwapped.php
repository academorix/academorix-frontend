<?php

declare(strict_types=1);

namespace Academorix\Search\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Search\Models\SearchIndex;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a `SearchIndex` alias is repointed to a new physical
 * version.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'search.index.alias_swapped')]
final readonly class SearchIndexAliasSwapped implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public SearchIndex $index)
    {
    }
}
