<?php

declare(strict_types=1);

namespace Academorix\Integrations\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a lookup expects a tenant integration but none matches
 * the given identifier / tenant scope.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
final class IntegrationNotFoundException extends AcademorixException
{
    public const CODE = 'integrations.not_found';

    public const TRANSLATION_KEY = 'integrations::errors.not_found';
}
