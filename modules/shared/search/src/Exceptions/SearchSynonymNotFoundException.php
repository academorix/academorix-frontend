<?php

declare(strict_types=1);

namespace Academorix\Search\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a `SearchSynonym` lookup fails.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchSynonymNotFoundException extends AcademorixException
{
    public const CODE = 'SEARCH_SYNONYM_NOT_FOUND';

    public const TRANSLATION_KEY = 'search::errors.synonym_not_found';
}
