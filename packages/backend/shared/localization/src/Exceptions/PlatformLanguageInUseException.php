<?php

declare(strict_types=1);

namespace Stackra\Localization\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when a platform admin tries to hard-delete a
 * {@see \Stackra\Localization\Models\PlatformLanguage} row that
 * has active TenantLocale references. Ops must archive
 * `is_platform_active=false` first, wait for tenants to migrate off,
 * then delete.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
final class PlatformLanguageInUseException extends Exception
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'localization.platform_language_in_use';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'localization::errors.platform_language_in_use';

    /**
     * Convenience factory used by the observer's refuse path.
     *
     * @param  string  $languageId       The platform-language id being deleted.
     * @param  string  $bcp47Code        The BCP-47 tag for user-facing messages.
     * @param  int     $referenceCount   How many TenantLocale rows still reference it.
     */
    public static function forLanguage(string $languageId, string $bcp47Code, int $referenceCount): self
    {
        return (new self(\sprintf(
            'Cannot delete platform language "%s" — %d tenant locale(s) still reference it.',
            $bcp47Code,
            $referenceCount,
        )));
    }
}
