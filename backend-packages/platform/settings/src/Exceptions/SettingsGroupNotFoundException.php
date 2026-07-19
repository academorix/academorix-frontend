<?php

declare(strict_types=1);

namespace Academorix\Settings\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a group-scoped endpoint targets a group slug that isn't
 * registered on any discovered `#[AsSetting]` class.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
final class SettingsGroupNotFoundException extends AcademorixException
{
    public const CODE = 'settings.group_not_found';

    public const TRANSLATION_KEY = 'settings::errors.group_not_found';
}
