<?php

declare(strict_types=1);

namespace Academorix\Search\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a `SearchSyncJob` lookup fails.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchJobNotFoundException extends AcademorixException
{
    public const CODE = 'SEARCH_JOB_NOT_FOUND';

    public const TRANSLATION_KEY = 'search::errors.job_not_found';
}
