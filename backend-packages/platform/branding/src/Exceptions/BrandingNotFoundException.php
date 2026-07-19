<?php

declare(strict_types=1);

namespace Academorix\Branding\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a lookup expects a branding profile but none is bound
 * (typical on tenant-scoped reads before the tenant has provisioned).
 *
 * @category Branding
 *
 * @since    0.1.0
 */
final class BrandingNotFoundException extends AcademorixException
{
    public const CODE = 'branding.not_found';

    public const TRANSLATION_KEY = 'branding::errors.not_found';
}
