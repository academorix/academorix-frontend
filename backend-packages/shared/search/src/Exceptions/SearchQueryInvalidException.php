<?php

declare(strict_types=1);

namespace Academorix\Search\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when the filter grammar, sort spec, or facet request is malformed.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchQueryInvalidException extends AcademorixException
{
    public const CODE = 'SEARCH_QUERY_INVALID';

    public const TRANSLATION_KEY = 'search::errors.query_invalid';
}
