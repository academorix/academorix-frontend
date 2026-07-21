<?php

declare(strict_types=1);

namespace Stackra\Search\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when the requested language is not supported by the engine.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchLanguageUnsupportedException extends StackraException
{
    public const CODE = 'SEARCH_LANGUAGE_UNSUPPORTED';

    public const TRANSLATION_KEY = 'search::errors.language_unsupported';
}
