<?php

declare(strict_types=1);

namespace Academorix\Integrations\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a caller attempts to sync (or otherwise operate on) an
 * integration whose `is_active` flag is false.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
final class IntegrationDisabledException extends AcademorixException
{
    public const CODE = 'integrations.disabled';

    public const TRANSLATION_KEY = 'integrations::errors.disabled';
}
