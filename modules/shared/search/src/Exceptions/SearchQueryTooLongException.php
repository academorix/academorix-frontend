<?php

declare(strict_types=1);

namespace Academorix\Search\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a query exceeds `config('search.query.max_length')`.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchQueryTooLongException extends AcademorixException
{
    public const CODE = 'SEARCH_QUERY_TOO_LONG';

    public const TRANSLATION_KEY = 'search::errors.query_too_long';
}
