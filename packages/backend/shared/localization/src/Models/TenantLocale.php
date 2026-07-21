<?php

declare(strict_types=1);

namespace Stackra\Localization\Models;

use Stackra\Activity\Concerns\HasActivityLog;
use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Database\Concerns\Model\HasUserStamp;
use Stackra\Localization\Contracts\Data\TenantLocaleInterface;
use Stackra\Localization\Database\Factories\TenantLocaleFactory;
use Stackra\Localization\Enums\TranslatorDriverName;
use Stackra\Localization\Observers\TenantLocaleObserver;
use Stackra\Localization\Policies\TenantLocalePolicy;
use Stackra\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a {@see TenantLocaleInterface}.
 *
 * Per-tenant enablement of a {@see PlatformLanguage}. Owns the
 * `is_default` (exactly-one-per-tenant), `is_fallback`
 * (at-most-one-per-tenant), and `is_active` flags plus the optional
 * `auto_translate_driver` override.
 *
 * The observer enforces the "only one default" / "only one fallback"
 * invariants + refuses to disable the default locale without a
 * successor promotion.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[Table(
    name: TenantLocaleInterface::TABLE,
    key: TenantLocaleInterface::PRIMARY_KEY,
    keyType: TenantLocaleInterface::KEY_TYPE,
)]
#[Fillable([
    TenantLocaleInterface::ATTR_TENANT_ID,
    TenantLocaleInterface::ATTR_LANGUAGE_ID,
    TenantLocaleInterface::ATTR_IS_DEFAULT,
    TenantLocaleInterface::ATTR_IS_FALLBACK,
    TenantLocaleInterface::ATTR_IS_ACTIVE,
    TenantLocaleInterface::ATTR_AUTO_TRANSLATE_DRIVER,
    TenantLocaleInterface::ATTR_MIN_QUALITY_SCORE,
])]
#[UseFactory(TenantLocaleFactory::class)]
#[UsePolicy(TenantLocalePolicy::class)]
#[ObservedBy([TenantLocaleObserver::class])]
final class TenantLocale extends Model implements AuditableContract, TenantLocaleInterface
{
    use Auditable;
    use BelongsToTenant;
    use HasActivityLog;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use HasUserStamp;
    use SoftDeletes;

    /**
     * Cast map — booleans + enum for the optional driver override.
     *
     * @var array<string, string>
     */
    protected $casts = [
        TenantLocaleInterface::ATTR_IS_DEFAULT            => 'boolean',
        TenantLocaleInterface::ATTR_IS_FALLBACK           => 'boolean',
        TenantLocaleInterface::ATTR_IS_ACTIVE             => 'boolean',
        TenantLocaleInterface::ATTR_AUTO_TRANSLATE_DRIVER => TranslatorDriverName::class,
        TenantLocaleInterface::ATTR_MIN_QUALITY_SCORE     => 'float',
    ];

    /**
     * The platform language this tenant has enabled.
     *
     * @return BelongsTo<PlatformLanguage, $this>
     */
    public function language(): BelongsTo
    {
        return $this->belongsTo(
            PlatformLanguage::class,
            TenantLocaleInterface::ATTR_LANGUAGE_ID,
        );
    }

    /**
     * Alias — the platform language relation. Present for
     * grep-friendliness alongside the accessor chain.
     *
     * @return BelongsTo<PlatformLanguage, $this>
     */
    public function platformLanguage(): BelongsTo
    {
        return $this->language();
    }

    /**
     * Accessor — BCP-47 code chained through the platform language.
     */
    public function getLanguageCodeAttribute(): ?string
    {
        return $this->language?->getAttribute(
            \Stackra\Localization\Contracts\Data\PlatformLanguageInterface::ATTR_BCP47_CODE,
        );
    }

    /**
     * Get the table associated with the model — resolved from config.
     */
    public function getTable(): string
    {
        return (string) \config(
            'localization.tables.tenant_locales',
            TenantLocaleInterface::TABLE,
        );
    }
}
