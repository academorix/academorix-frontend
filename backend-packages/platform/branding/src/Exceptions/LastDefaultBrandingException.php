<?php

declare(strict_types=1);

namespace Academorix\Branding\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a caller attempts to delete the tenant's default
 * branding row. Would leave the tenant without a fallback profile;
 * caller must promote another row first.
 *
 * @category Branding
 *
 * @since    0.1.0
 */
final class LastDefaultBrandingException extends AcademorixException
{
    public const CODE = 'branding.last_default';

    public const TRANSLATION_KEY = 'branding::errors.last_default';
}
