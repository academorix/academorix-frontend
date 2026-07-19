<?php

declare(strict_types=1);

namespace Academorix\Settings\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a `get()` targets a key that isn't registered on any
 * discovered `#[AsSetting]` class.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
final class SettingNotFoundException extends AcademorixException
{
    public const CODE = 'settings.not_found';

    public const TRANSLATION_KEY = 'settings::errors.not_found';
}
