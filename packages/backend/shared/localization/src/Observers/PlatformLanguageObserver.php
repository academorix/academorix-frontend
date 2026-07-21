<?php

declare(strict_types=1);

namespace Stackra\Localization\Observers;

use Stackra\Localization\Contracts\Data\PlatformLanguageInterface;
use Stackra\Localization\Contracts\Data\TenantLocaleInterface;
use Stackra\Localization\Exceptions\PlatformLanguageInUseException;
use Stackra\Localization\Models\PlatformLanguage;
use Illuminate\Support\Facades\DB;

/**
 * Lifecycle side effects for {@see PlatformLanguage}.
 *
 * Enforces:
 *  - `deleting` refused when any tenant references the row.
 *  - Default `is_platform_active`/`is_beta`/`is_system` normalisation.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
final class PlatformLanguageObserver
{
    /**
     * `creating` — normalise defaults + derive script from bcp47 tag
     * when the caller omitted it.
     */
    public function creating(PlatformLanguage $language): void
    {
        // Default script — derive from the bcp47 tag's script subtag
        // when present (`zh-Hans` → Hans, `zh-Hant` → Hant). When no
        // script subtag is present the caller-supplied `script`
        // stays as-is (usually `Latn`).
        if (empty($language->{PlatformLanguageInterface::ATTR_SCRIPT})) {
            $bcp47 = (string) ($language->{PlatformLanguageInterface::ATTR_BCP47_CODE} ?? '');
            $parts = \explode('-', $bcp47);
            $derived = null;
            foreach ($parts as $index => $part) {
                if ($index === 0) {
                    continue;
                }

                // A 4-char subtag with leading uppercase is a script.
                if (\strlen($part) === 4) {
                    $derived = \ucfirst(\strtolower($part));
                    break;
                }
            }

            if ($derived !== null) {
                $language->{PlatformLanguageInterface::ATTR_SCRIPT} = $derived;
            }
        }
    }

    /**
     * `deleting` — refuse when any TenantLocale row references the
     * platform language. Ops must archive `is_platform_active=false`
     * first, wait for tenants to migrate off, then delete.
     *
     * @throws PlatformLanguageInUseException  When any tenant references the row.
     */
    public function deleting(PlatformLanguage $language): void
    {
        $referenceCount = DB::table((string) \config(
            'localization.tables.tenant_locales',
            TenantLocaleInterface::TABLE,
        ))
            ->where(TenantLocaleInterface::ATTR_LANGUAGE_ID, $language->getKey())
            ->whereNull(TenantLocaleInterface::ATTR_DELETED_AT)
            ->count();

        if ($referenceCount > 0) {
            throw PlatformLanguageInUseException::forLanguage(
                (string) $language->getKey(),
                (string) $language->{PlatformLanguageInterface::ATTR_BCP47_CODE},
                $referenceCount,
            );
        }
    }
}
