<?php

declare(strict_types=1);

namespace Academorix\Search\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when the requested language is not supported by the engine.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchLanguageUnsupportedException extends AcademorixException
{
    public const CODE = 'SEARCH_LANGUAGE_UNSUPPORTED';

    public const TRANSLATION_KEY = 'search::errors.language_unsupported';
}
