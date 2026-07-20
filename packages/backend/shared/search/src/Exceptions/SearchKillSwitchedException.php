<?php

declare(strict_types=1);

namespace Academorix\Search\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a `search.*` kill switch is off.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchKillSwitchedException extends AcademorixException
{
    public const CODE = 'SEARCH_KILL_SWITCHED';

    public const TRANSLATION_KEY = 'search::errors.kill_switched';
}
