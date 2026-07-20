<?php

declare(strict_types=1);

namespace Academorix\Search\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when the underlying Scout driver throws.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchScoutDriverFailureException extends AcademorixException
{
    public const CODE = 'SEARCH_SCOUT_DRIVER_FAILURE';

    public const TRANSLATION_KEY = 'search::errors.scout_driver_failure';
}
