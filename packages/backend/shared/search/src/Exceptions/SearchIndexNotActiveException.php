<?php

declare(strict_types=1);

namespace Academorix\Search\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a search index is in reindexing / disabled / error state.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchIndexNotActiveException extends AcademorixException
{
    public const CODE = 'SEARCH_INDEX_NOT_ACTIVE';

    public const TRANSLATION_KEY = 'search::errors.index_not_active';
}
