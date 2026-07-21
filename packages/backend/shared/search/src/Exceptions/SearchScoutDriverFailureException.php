<?php

declare(strict_types=1);

namespace Stackra\Search\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when the underlying Scout driver throws.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchScoutDriverFailureException extends StackraException
{
    public const CODE = 'SEARCH_SCOUT_DRIVER_FAILURE';

    public const TRANSLATION_KEY = 'search::errors.scout_driver_failure';
}
