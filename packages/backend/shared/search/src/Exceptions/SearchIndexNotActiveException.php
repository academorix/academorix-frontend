<?php

declare(strict_types=1);

namespace Stackra\Search\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when a search index is in reindexing / disabled / error state.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchIndexNotActiveException extends StackraException
{
    public const CODE = 'SEARCH_INDEX_NOT_ACTIVE';

    public const TRANSLATION_KEY = 'search::errors.index_not_active';
}
