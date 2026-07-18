<?php

declare(strict_types=1);

namespace Academorix\Search\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a query references a model class that isn't registered.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchModelNotSearchableException extends AcademorixException
{
    public const CODE = 'SEARCH_MODEL_NOT_SEARCHABLE';

    public const TRANSLATION_KEY = 'search::errors.model_not_searchable';
}
