<?php

declare(strict_types=1);

namespace Stackra\Search\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when a saved-query payload fails validation.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchSavedQueryInvalidException extends StackraException
{
    public const CODE = 'SEARCH_SAVED_QUERY_INVALID';

    public const TRANSLATION_KEY = 'search::errors.saved_query_invalid';
}
