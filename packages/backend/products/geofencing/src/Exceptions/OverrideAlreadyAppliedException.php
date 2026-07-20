<?php

declare(strict_types=1);

namespace Academorix\Geofencing\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a caller requests an override on a check that already has one
 * applied.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
final class OverrideAlreadyAppliedException extends AcademorixException
{
    public const string CODE = 'geofencing.override_already_applied';

    public const string TRANSLATION_KEY = 'geofencing::errors.override_already_applied';
}
