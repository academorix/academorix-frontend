<?php

declare(strict_types=1);

namespace Academorix\Localization\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a tenant hits the `localization.locales.count`
 * entitlement cap while enabling a new locale.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
final class TenantLocaleQuotaExceededException extends AcademorixException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'localization.tenant_locale_quota_exceeded';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'localization::errors.tenant_locale_quota_exceeded';
}
