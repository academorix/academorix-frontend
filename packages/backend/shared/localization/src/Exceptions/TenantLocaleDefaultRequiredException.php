<?php

declare(strict_types=1);

namespace Stackra\Localization\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when a caller tries to disable / delete the tenant's
 * default locale without promoting a successor first.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
final class TenantLocaleDefaultRequiredException extends StackraException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'localization.tenant_locale_default_required';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'localization::errors.tenant_locale_default_required';

    /**
     * Convenience factory.
     *
     * @param  string  $tenantLocaleId  The row id being refused.
     */
    public static function forLocale(string $tenantLocaleId): self
    {
        return new self(\sprintf(
            'Cannot disable tenant locale "%s" — it is the tenant\'s default. Promote another locale first.',
            $tenantLocaleId,
        ));
    }
}
