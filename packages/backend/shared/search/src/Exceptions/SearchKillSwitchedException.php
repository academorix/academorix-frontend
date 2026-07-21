<?php

declare(strict_types=1);

namespace Stackra\Search\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when a `search.*` kill switch is off.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchKillSwitchedException extends StackraException
{
    public const CODE = 'SEARCH_KILL_SWITCHED';

    public const TRANSLATION_KEY = 'search::errors.kill_switched';
}
