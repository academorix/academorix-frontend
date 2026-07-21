<?php

declare(strict_types=1);

namespace Stackra\Search\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when a `SearchSyncJob` lookup fails.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchJobNotFoundException extends Exception
{
    public const CODE = 'SEARCH_JOB_NOT_FOUND';

    public const TRANSLATION_KEY = 'search::errors.job_not_found';
}
