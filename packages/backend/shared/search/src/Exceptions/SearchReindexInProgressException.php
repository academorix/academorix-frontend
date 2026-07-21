<?php

declare(strict_types=1);

namespace Stackra\Search\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when a reindex is already running for the target index.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchReindexInProgressException extends Exception
{
    public const CODE = 'SEARCH_REINDEX_IN_PROGRESS';

    public const TRANSLATION_KEY = 'search::errors.reindex_in_progress';
}
