<?php

declare(strict_types=1);

namespace Academorix\Search\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when the `SearchSyncJob` state machine is violated.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchInvalidStateTransitionException extends AcademorixException
{
    public const CODE = 'SEARCH_INVALID_STATE_TRANSITION';

    public const TRANSLATION_KEY = 'search::errors.invalid_state_transition';
}
