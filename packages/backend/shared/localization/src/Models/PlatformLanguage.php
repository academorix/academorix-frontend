<?php

declare(strict_types=1);

namespace Stackra\Localization\Models;

use Stackra\Database\Concerns\Model\HasUserStamp;
use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Geography\Models\Country as GeographyCountry;
use Stackra\Geography\Models\Language as GeographyLanguage;
use Stackra\Localization\Contracts\Data\PlatformLanguageInterface;
use Stackra\Localization\Database\Factories\PlatformLanguageFactory;
use Stackra\Localization\Enums\TextDirection;
use Stackra\Localization\Observers\PlatformLanguageObserver;
use Stackra\Localization\Policies\PlatformLanguagePolicy;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a {@see PlatformLanguageInterface}.
 *
 * Platform-plane catalogue of BCP-47 locale tags. NO tenant scoping
 * — every tenant reads the same catalogue.
 *
 * ISO-639-1 code, English name, native name, and text direction are
 * READ from the referenced `geography::Language` via the accessor
 * chain — never stored on this table. Regional-variant flag emoji
 * and country name are READ from `geography::Country` when
 * `geography_country_id` is set (e.g. `fr-CA`, `en-GB`, `pt-BR`).
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[Table(
    name: PlatformLanguageInterface::TABLE,
    key: PlatformLanguageInterface::PRIMARY_KEY,
    keyType: PlatformLanguageInterface::KEY_TYPE,
)]
#[Fillable([
    PlatformLanguageInterface::ATTR_BCP47_CODE,
    PlatformLanguageInterface::ATTR_GEOGRAPHY_LANGUAGE_ID,
    PlatformLanguageInterface::ATTR_GEOGRAPHY_COUNTRY_ID,
    PlatformLanguageInterface::ATTR_SCRIPT,
    PlatformLanguageInterface::ATTR_IS_PLATFORM_ACTIVE,
    PlatformLanguageInterface::ATTR_IS_BETA,
    PlatformLanguageInterface::ATTR_IS_SYSTEM,
    PlatformLanguageInterface::ATTR_SORT_ORDER,
    PlatformLanguageInterface::ATTR_NOTES,
    PlatformLanguageInterface::ATTR_METADATA,
])]
#[UseFactory(PlatformLanguageFactory::class)]
#[UsePolicy(PlatformLanguagePolicy::class)]
#[ObservedBy([PlatformLanguageObserver::class])]
final class PlatformLanguage extends Model implements AuditableContract, PlatformLanguageInterface
{
    use Auditable;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use HasUserStamp;
    use SoftDeletes;

    /**
     * Cast map — booleans + JSON metadata.
     *
     * @var array<string, string>
     */
    protected $casts = [
        PlatformLanguageInterface::ATTR_IS_PLATFORM_ACTIVE => 'boolean',
        PlatformLanguageInterface::ATTR_IS_BETA            => 'boolean',
        PlatformLanguageInterface::ATTR_IS_SYSTEM          => 'boolean',
        PlatformLanguageInterface::ATTR_SORT_ORDER         => 'integer',
        PlatformLanguageInterface::ATTR_METADATA           => 'array',
    ];

    /**
     * The ISO-639-1 language this catalogue row references. Source of
     * truth for `code`, `name`, `native`, `dir`, `is_rtl`.
     *
     * @return BelongsTo<GeographyLanguage, $this>
     */
    public function geographyLanguage(): BelongsTo
    {
        return $this->belongsTo(
            GeographyLanguage::class,
            PlatformLanguageInterface::ATTR_GEOGRAPHY_LANGUAGE_ID,
        );
    }

    /**
     * Optional `geography::Country` reference — populated only for
     * regional variants like `fr-CA` / `en-GB` / `pt-BR`. Source of
     * the country-region flag emoji.
     *
     * @return BelongsTo<GeographyCountry, $this>
     */
    public function geographyCountry(): BelongsTo
    {
        return $this->belongsTo(
            GeographyCountry::class,
            PlatformLanguageInterface::ATTR_GEOGRAPHY_COUNTRY_ID,
        );
    }

    /**
     * Reverse — every tenant enablement of this platform language.
     *
     * @return HasMany<TenantLocale, $this>
     */
    public function tenantLocales(): HasMany
    {
        return $this->hasMany(TenantLocale::class, TenantLocale::query()->getModel()->getForeignKey());
    }

    /**
     * Reverse — every persisted translation row using this platform
     * language.
     *
     * @return HasMany<Translation, $this>
     */
    public function translations(): HasMany
    {
        return $this->hasMany(Translation::class, Translation::query()->getModel()->getForeignKey());
    }

    /**
     * Accessor — ISO-639-1 code from the joined geography language.
     */
    public function getIso6391Attribute(): ?string
    {
        return $this->geographyLanguage?->getAttribute('code');
    }

    /**
     * Accessor — English name from the joined geography language.
     */
    public function getNameAttribute(): ?string
    {
        return $this->geographyLanguage?->getAttribute('name');
    }

    /**
     * Accessor — native name from the joined geography language.
     */
    public function getNativeNameAttribute(): ?string
    {
        return $this->geographyLanguage?->getAttribute('native');
    }

    /**
     * Accessor — text direction. Chains `geography::Language.is_rtl`;
     * falls back to `geography::Language.dir` for edge cases where
     * `is_rtl` was not set.
     */
    public function getDirectionAttribute(): TextDirection
    {
        $lang = $this->geographyLanguage;
        if ($lang === null) {
            return TextDirection::Ltr;
        }

        if ((bool) $lang->getAttribute('is_rtl') === true) {
            return TextDirection::Rtl;
        }

        $dir = $lang->getAttribute('dir');

        return $dir === 'rtl' ? TextDirection::Rtl : TextDirection::Ltr;
    }

    /**
     * Accessor — flag emoji for the regional variant, when this row
     * pairs with a country. Base languages (English, French, Spanish)
     * return `null` — no single flag is appropriate.
     */
    public function getFlagEmojiAttribute(): ?string
    {
        return $this->geographyCountry?->getAttribute('emoji');
    }

    /**
     * Get the table associated with the model — resolved from config
     * so consumer apps can swap the table name without patching the
     * model directly.
     */
    public function getTable(): string
    {
        return (string) \config(
            'localization.tables.platform_languages',
            PlatformLanguageInterface::TABLE,
        );
    }
}
