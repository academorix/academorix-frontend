<?php

declare(strict_types=1);

namespace Academorix\Search\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a caller attempts to cancel a `SearchSyncJob` that is
 * already in a terminal state.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchJobNotCancellableException extends AcademorixException
{
    public const CODE = 'SEARCH_JOB_NOT_CANCELLABLE';

    public const TRANSLATION_KEY = 'search::errors.job_not_cancellable';
}
