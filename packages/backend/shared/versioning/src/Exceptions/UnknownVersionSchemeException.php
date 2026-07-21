<?php

declare(strict_types=1);

namespace Stackra\Versioning\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when {@see \Stackra\Versioning\Contracts\Services\VersionSchemeRegistryInterface::resolve()}
 * is called with a scheme name that isn't registered.
 *
 * Only reachable via a data-integrity bug (an `api_versions.scheme`
 * row that names a scheme without a bound adapter) or a consumer
 * misconfiguration during boot.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
final class UnknownVersionSchemeException extends Exception
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'versioning.unknown_scheme';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'versioning::errors.unknown_scheme';
}
