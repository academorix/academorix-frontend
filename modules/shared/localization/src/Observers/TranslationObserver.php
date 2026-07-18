<?php

declare(strict_types=1);

namespace Academorix\Localization\Observers;

use Academorix\Localization\Contracts\Data\PlatformLanguageInterface;
use Academorix\Localization\Contracts\Data\TranslationInterface;
use Academorix\Localization\Contracts\Services\TranslationCacheInterface;
use Academorix\Localization\Enums\TranslationSource;
use Academorix\Localization\Events\TranslationOverridden;
use Academorix\Localization\Models\PlatformLanguage;
use Academorix\Localization\Models\Translation;

/**
 * Lifecycle side effects for {@see Translation}.
 *
 * Denormalises `locale_code` from the joined PlatformLanguage row +
 * invalidates the cache tag on any mutation + fires
 * `TranslationOverridden` when a machine translation is marked
 * verified by a human reviewer.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
final class TranslationObserver
{
    public function __construct(
        private readonly TranslationCacheInterface $cache,
    ) {
    }

    /**
     * `saving` — denormalise `locale_code` from the joined platform
     * language whenever the caller left it empty.
     */
    public function saving(Translation $translation): void
    {
        $localeCode = $translation->{TranslationInterface::ATTR_LOCALE_CODE} ?? null;
        if (\is_string($localeCode) && $localeCode !== '') {
            return;
        }

        $languageId = $translation->{TranslationInterface::ATTR_LANGUAGE_ID} ?? null;
        if ($languageId === null || $languageId === '') {
            return;
        }

        // Read the bcp47 code directly rather than through the
        // relation — the relation may not be hydrated on a fresh
        // row and Eloquent would fire a second query.
        $bcp47 = PlatformLanguage::query()
            ->whereKey($languageId)
            ->value(PlatformLanguageInterface::ATTR_BCP47_CODE);

        if ($bcp47 !== null) {
            $translation->{TranslationInterface::ATTR_LOCALE_CODE} = (string) $bcp47;
        }
    }

    /**
     * `saved` — invalidate the cache tag for `(tenant, locale)`. Fires
     * for both create + update.
     */
    public function saved(Translation $translation): void
    {
        $tenantId   = $translation->{TranslationInterface::ATTR_TENANT_ID};
        $localeCode = (string) ($translation->{TranslationInterface::ATTR_LOCALE_CODE} ?? '');

        $this->cache->forget(
            $tenantId === null ? null : (string) $tenantId,
            $localeCode,
        );
    }

    /**
     * `updated` — fire the override event when a machine translation
     * is edited into a human-verified row.
     */
    public function updated(Translation $translation): void
    {
        $verifiedChanged = $translation->wasChanged(TranslationInterface::ATTR_IS_VERIFIED)
            && (bool) $translation->{TranslationInterface::ATTR_IS_VERIFIED} === true;

        $source = $translation->{TranslationInterface::ATTR_SOURCE};
        $wasMachine = $source instanceof TranslationSource
            ? $source === TranslationSource::Machine
            : (string) $source === TranslationSource::Machine->value;

        if ($verifiedChanged && $wasMachine) {
            TranslationOverridden::dispatch(
                (string) ($translation->{TranslationInterface::ATTR_TENANT_ID} ?? ''),
                (string) $translation->getKey(),
                (string) ($translation->{TranslationInterface::ATTR_VERIFIED_BY} ?? ''),
                (string) $translation->{TranslationInterface::ATTR_NAMESPACE},
                (string) $translation->{TranslationInterface::ATTR_KEY},
                (string) $translation->{TranslationInterface::ATTR_LOCALE_CODE},
            );
        }
    }

    /**
     * `deleted` — invalidate the cache tag on delete too.
     */
    public function deleted(Translation $translation): void
    {
        $tenantId   = $translation->{TranslationInterface::ATTR_TENANT_ID};
        $localeCode = (string) ($translation->{TranslationInterface::ATTR_LOCALE_CODE} ?? '');

        $this->cache->forget(
            $tenantId === null ? null : (string) $tenantId,
            $localeCode,
        );
    }
}
