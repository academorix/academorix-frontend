<?php

declare(strict_types=1);

namespace Stackra\Integrations\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when a lookup expects a tenant integration but none matches
 * the given identifier / tenant scope.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
final class IntegrationNotFoundException extends Exception
{
    public const CODE = 'integrations.not_found';

    public const TRANSLATION_KEY = 'integrations::errors.not_found';
}
