<?php

declare(strict_types=1);

namespace Stackra\Localization\Database\Seeders;

use Stackra\Geography\Contracts\Data\CountryInterface as GeographyCountryInterface;
use Stackra\Geography\Contracts\Data\LanguageInterface as GeographyLanguageInterface;
use Stackra\Localization\Contracts\Data\PlatformLanguageInterface;
use Stackra\Localization\Models\PlatformLanguage;
use Stackra\ServiceProvider\Attributes\AsSeeder;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seed the platform language catalogue with ~30 common BCP-47 tags.
 *
 * Each row resolves `geography_language_id` + optional
 * `geography_country_id` via lookup against the vendor-seeded
 * geography rows (`nnjeim/world`). Requires `php artisan world:install`
 * to have run first — the seeder skips silently when the geography
 * tables are empty so a fresh database bootstrap doesn't crash.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsSeeder(priority: 48, environments: [])]
final class PlatformLanguageSeeder extends Seeder
{
    /**
     * The catalogue — 30 common BCP-47 tags. Each entry:
     *   [bcp47, iso639_1, country_iso2 | null, script, sort_order]
     *
     * @var list<array{0:string,1:string,2:?string,3:string,4:int}>
     */
    private const array CATALOGUE = [
        ['en',      'en', null, 'Latn', 10],
        ['en-GB',   'en', 'GB', 'Latn', 11],
        ['en-US',   'en', 'US', 'Latn', 12],
        ['en-AU',   'en', 'AU', 'Latn', 13],
        ['en-CA',   'en', 'CA', 'Latn', 14],
        ['fr',      'fr', null, 'Latn', 20],
        ['fr-CA',   'fr', 'CA', 'Latn', 21],
        ['fr-BE',   'fr', 'BE', 'Latn', 22],
        ['es',      'es', null, 'Latn', 30],
        ['es-MX',   'es', 'MX', 'Latn', 31],
        ['de',      'de', null, 'Latn', 40],
        ['de-AT',   'de', 'AT', 'Latn', 41],
        ['it',      'it', null, 'Latn', 50],
        ['pt',      'pt', null, 'Latn', 60],
        ['pt-BR',   'pt', 'BR', 'Latn', 61],
        ['nl',      'nl', null, 'Latn', 70],
        ['sv',      'sv', null, 'Latn', 80],
        ['no',      'no', null, 'Latn', 81],
        ['fi',      'fi', null, 'Latn', 82],
        ['da',      'da', null, 'Latn', 83],
        ['pl',      'pl', null, 'Latn', 90],
        ['cs',      'cs', null, 'Latn', 91],
        ['ru',      'ru', null, 'Cyrl', 100],
        ['tr',      'tr', null, 'Latn', 110],
        ['ar',      'ar', null, 'Arab', 120],
        ['he',      'he', null, 'Hebr', 121],
        ['fa',      'fa', null, 'Arab', 122],
        ['ur',      'ur', null, 'Arab', 123],
        ['ja',      'ja', null, 'Jpan', 130],
        ['ko',      'ko', null, 'Kore', 131],
        ['zh-Hans', 'zh', null, 'Hans', 140],
        ['zh-Hant', 'zh', null, 'Hant', 141],
        ['hi',      'hi', null, 'Deva', 150],
    ];

    /**
     * Run the seeder.
     */
    public function run(): void
    {
        // Guard — geography tables may not exist yet on fresh
        // installs (world:install runs after the seed pump on
        // greenfield bootstraps). Skip cleanly so downstream
        // migrations proceed.
        if (DB::table(GeographyLanguageInterface::TABLE)->count() === 0) {
            return;
        }

        foreach (self::CATALOGUE as [$bcp47, $iso639, $countryIso2, $script, $sortOrder]) {
            $languageId = (int) DB::table(GeographyLanguageInterface::TABLE)
                ->where(GeographyLanguageInterface::ATTR_CODE, $iso639)
                ->value(GeographyLanguageInterface::ATTR_ID);

            if ($languageId === 0) {
                // Vendor row missing — skip; the reconcile command
                // surfaces the gap so the operator can decide.
                continue;
            }

            $countryId = null;
            if ($countryIso2 !== null) {
                $countryRaw = DB::table(GeographyCountryInterface::TABLE)
                    ->where(GeographyCountryInterface::ATTR_ISO2, $countryIso2)
                    ->value(GeographyCountryInterface::ATTR_ID);

                $countryId = $countryRaw !== null ? (int) $countryRaw : null;
            }

            PlatformLanguage::query()->updateOrCreate(
                [PlatformLanguageInterface::ATTR_BCP47_CODE => $bcp47],
                [
                    PlatformLanguageInterface::ATTR_GEOGRAPHY_LANGUAGE_ID => $languageId,
                    PlatformLanguageInterface::ATTR_GEOGRAPHY_COUNTRY_ID  => $countryId,
                    PlatformLanguageInterface::ATTR_SCRIPT                => $script,
                    PlatformLanguageInterface::ATTR_IS_PLATFORM_ACTIVE    => true,
                    PlatformLanguageInterface::ATTR_IS_SYSTEM             => true,
                    PlatformLanguageInterface::ATTR_SORT_ORDER            => $sortOrder,
                ],
            );
        }
    }
}
