<?php

declare(strict_types=1);

namespace Academorix\Search\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when the referenced artifact source is missing or wrong.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchArtifactSourceInvalidException extends AcademorixException
{
    public const CODE = 'SEARCH_ARTIFACT_SOURCE_INVALID';

    public const TRANSLATION_KEY = 'search::errors.artifact_source_invalid';
}
