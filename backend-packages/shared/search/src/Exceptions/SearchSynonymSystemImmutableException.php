<?php

declare(strict_types=1);

namespace Academorix\Search\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a caller attempts to delete a system-seeded synonym.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchSynonymSystemImmutableException extends AcademorixException
{
    public const CODE = 'SEARCH_SYNONYM_SYSTEM_IMMUTABLE';

    public const TRANSLATION_KEY = 'search::errors.synonym_system_immutable';
}
