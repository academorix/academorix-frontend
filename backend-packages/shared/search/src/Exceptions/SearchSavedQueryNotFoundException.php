<?php

declare(strict_types=1);

namespace Academorix\Search\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a `SearchSavedQuery` lookup fails.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchSavedQueryNotFoundException extends AcademorixException
{
    public const CODE = 'SEARCH_SAVED_QUERY_NOT_FOUND';

    public const TRANSLATION_KEY = 'search::errors.saved_query_not_found';
}
