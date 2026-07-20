<?php

declare(strict_types=1);

namespace Academorix\Search\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a search index is expected but not found.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchIndexNotFoundException extends AcademorixException
{
    public const CODE = 'SEARCH_INDEX_NOT_FOUND';

    public const TRANSLATION_KEY = 'search::errors.index_not_found';
}
