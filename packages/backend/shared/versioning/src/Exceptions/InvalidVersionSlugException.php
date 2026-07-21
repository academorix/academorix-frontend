<?php

declare(strict_types=1);

namespace Stackra\Versioning\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when a version slug fails validation.
 *
 * Slugs must match `^v\d+(\.\d+(\.\d+)?)?$` (`v1`, `v1.2`, `v1.2.3`)
 * or, for CalVer, `\d{4}(-\d{2}(-\d{2})?)?` (`2024`, `2024-10`,
 * `2024-10-15`). Reserved slugs (`default`, `current`, `latest`) are
 * always refused.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
final class InvalidVersionSlugException extends StackraException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'versioning.invalid_slug';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'versioning::errors.invalid_slug';
}
