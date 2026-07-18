<?php

declare(strict_types=1);

namespace Academorix\Search\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when the resolved engine is unreachable.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchEngineUnavailableException extends AcademorixException
{
    public const CODE = 'SEARCH_ENGINE_UNAVAILABLE';

    public const TRANSLATION_KEY = 'search::errors.engine_unavailable';
}
