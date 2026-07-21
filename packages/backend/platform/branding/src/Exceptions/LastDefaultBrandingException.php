<?php

declare(strict_types=1);

namespace Stackra\Branding\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when a caller attempts to delete the tenant's default
 * branding row. Would leave the tenant without a fallback profile;
 * caller must promote another row first.
 *
 * @category Branding
 *
 * @since    0.1.0
 */
final class LastDefaultBrandingException extends StackraException
{
    public const CODE = 'branding.last_default';

    public const TRANSLATION_KEY = 'branding::errors.last_default';
}
