<?php

declare(strict_types=1);

namespace Stackra\Versioning\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when a caller targets an ApiVersion slug that doesn't exist.
 *
 * The middleware maps this to HTTP 406 with the machine-readable
 * error code `versioning.version_not_found` on the JSON envelope.
 * The response body includes the list of available versions so the
 * caller can migrate.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
final class ApiVersionNotFoundException extends Exception
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'versioning.version_not_found';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'versioning::errors.version_not_found';
}
