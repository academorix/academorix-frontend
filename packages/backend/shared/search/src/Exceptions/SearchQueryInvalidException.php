<?php

declare(strict_types=1);

namespace Stackra\Search\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when the filter grammar, sort spec, or facet request is malformed.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchQueryInvalidException extends Exception
{
    public const CODE = 'SEARCH_QUERY_INVALID';

    public const TRANSLATION_KEY = 'search::errors.query_invalid';
}
