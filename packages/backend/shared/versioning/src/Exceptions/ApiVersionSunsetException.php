<?php

declare(strict_types=1);

namespace Stackra\Versioning\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when a caller targets an ApiVersion in `sunset` status.
 *
 * The middleware maps this to HTTP 410 Gone with the machine-readable
 * error code `versioning.version_sunset` on the JSON envelope. The
 * response includes a `Link: rel=successor-version` header pointing
 * at the migration target and a `Sunset` header carrying the retired
 * date for archaeology.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
final class ApiVersionSunsetException extends Exception
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'versioning.version_sunset';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'versioning::errors.version_sunset';
}
