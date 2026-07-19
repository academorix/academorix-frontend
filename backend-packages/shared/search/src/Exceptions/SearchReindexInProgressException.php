<?php

declare(strict_types=1);

namespace Academorix\Search\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a reindex is already running for the target index.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchReindexInProgressException extends AcademorixException
{
    public const CODE = 'SEARCH_REINDEX_IN_PROGRESS';

    public const TRANSLATION_KEY = 'search::errors.reindex_in_progress';
}
