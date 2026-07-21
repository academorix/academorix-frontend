<?php

declare(strict_types=1);

namespace Stackra\Search\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when a `SearchSynonym` lookup fails.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchSynonymNotFoundException extends StackraException
{
    public const CODE = 'SEARCH_SYNONYM_NOT_FOUND';

    public const TRANSLATION_KEY = 'search::errors.synonym_not_found';
}
