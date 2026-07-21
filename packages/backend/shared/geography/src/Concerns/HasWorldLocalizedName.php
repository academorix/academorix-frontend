<?php

declare(strict_types=1);

namespace Stackra\Geography\Concerns;

use Illuminate\Support\Facades\Lang;

/**
 * Adds locale-aware name resolution to a Country model.
 *
 * Vendor `nnjeim/world` ships translations for country names in 23
 * locales under `resources/lang/vendor/world/{locale}/country.php`
 * keyed by uppercase ISO-3166 alpha-2 (`world::country.FR` →
 * "France" in French for locale `fr`, "France" in Spanish for `es`).
 *
 * ## Adds
 *
 *  - `resolveLocalizedName(?string $locale = null): string` — resolve
 *    against `world::country.<ISO2>` for the passed-in locale (or the
 *    current app locale) with a defensive `Lang::has()` guard. Falls
 *    back to the English DB `name` column when the translation key is
 *    missing.
 *  - `getLocalizedNameAttribute(): string` — Eloquent accessor so
 *    `$country->localized_name` works. Serialised to the wire when the
 *    model appends `localized_name`.
 *
 * Applied to `Country` only today. Vendor does not ship translations
 * for the other five entities, so composing the trait there would be
 * a no-op — deferred until vendor ships them.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
trait HasWorldLocalizedName
{
    /**
     * Resolve the localized display name for the current locale (or
     * the passed-in `$locale`).
     *
     * @param  string|null  $locale  BCP-47 locale identifier. Defaults
     *                               to the app's current locale.
     * @return string  Localized name or the English DB fallback.
     */
    public function resolveLocalizedName(?string $locale = null): string
    {
        $locale ??= (string) \app()->getLocale();
        $iso2   = (string) ($this->{'iso2'} ?? '');

        // Empty iso2 — nothing to resolve against; the English `name`
        // column IS the answer.
        if ($iso2 === '') {
            return (string) ($this->{'name'} ?? '');
        }

        $key = 'world::country.' . \strtoupper($iso2);

        // Guard against missing keys — vendor only ships 23 locales,
        // any consumer setting `locale=xx` outside that list falls
        // through to the DB row's English name.
        if (! Lang::has($key, $locale)) {
            return (string) ($this->{'name'} ?? '');
        }

        /** @var string $translated */
        $translated = Lang::get($key, [], $locale);

        return $translated;
    }

    /**
     * Accessor for `$model->localized_name` — used when the model
     * appends `localized_name` for wire serialisation.
     */
    public function getLocalizedNameAttribute(): string
    {
        return $this->resolveLocalizedName();
    }
}
