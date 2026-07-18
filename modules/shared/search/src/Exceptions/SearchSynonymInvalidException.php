<?php

declare(strict_types=1);

namespace Academorix\Search\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a synonym payload fails validation (empty terms,
 * missing one_way source, duplicate).
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchSynonymInvalidException extends AcademorixException
{
    public const CODE = 'SEARCH_SYNONYM_INVALID';

    public const TRANSLATION_KEY = 'search::errors.synonym_invalid';
}
