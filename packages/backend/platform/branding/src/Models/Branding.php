<?php

declare(strict_types=1);

namespace Stackra\Branding\Models;

use Stackra\Branding\Contracts\Data\BrandingInterface;
use Stackra\Branding\Database\Factories\BrandingFactory;
use Stackra\Branding\Enums\BrandingTheme;
use Stackra\Branding\Observers\BrandingObserver;
use Stackra\Branding\Policies\BrandingPolicy;
use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Mattiverse\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;
use Spatie\Translatable\HasTranslations;

/**
 * Eloquent model for a {@see BrandingInterface}.
 *
 * Theme + palette + logo profile per Tenant. `name` is translated via
 * `spatie/laravel-translatable`. Composes `BelongsToTenant` so reads
 * auto-scope to the active tenant.
 */
#[Table(
    name: BrandingInterface::TABLE,
    key: BrandingInterface::PRIMARY_KEY,
    keyType: BrandingInterface::KEY_TYPE,
)]
#[Fillable([
    BrandingInterface::ATTR_TENANT_ID,
    BrandingInterface::ATTR_DOMAIN_ID,
    BrandingInterface::ATTR_NAME,
    BrandingInterface::ATTR_IS_DEFAULT,
    BrandingInterface::ATTR_THEME,
    BrandingInterface::ATTR_LOGO_URL,
    BrandingInterface::ATTR_LOGO_DARK_URL,
    BrandingInterface::ATTR_FAVICON_URL,
    BrandingInterface::ATTR_PRIMARY_COLOR,
    BrandingInterface::ATTR_SECONDARY_COLOR,
    BrandingInterface::ATTR_ACCENT_COLOR,
    BrandingInterface::ATTR_BACKGROUND_COLOR,
    BrandingInterface::ATTR_SURFACE_COLOR,
    BrandingInterface::ATTR_TEXT_COLOR,
    BrandingInterface::ATTR_FONT_STACK,
    BrandingInterface::ATTR_CUSTOM_FONT_URL,
    BrandingInterface::ATTR_CSS_VARIABLES,
    BrandingInterface::ATTR_METADATA,
    BrandingInterface::ATTR_TRANSLATIONS,
])]
#[UseFactory(BrandingFactory::class)]
#[UsePolicy(BrandingPolicy::class)]
#[ObservedBy([BrandingObserver::class])]
#[WithoutIncrementing]
final class Branding extends Model implements AuditableContract, BrandingInterface
{
    use Auditable;
    use BelongsToTenant;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use HasTranslations;
    use SoftDeletes;
    use Userstamps;

    /**
     * Translatable field names — read by
     * `spatie/laravel-translatable`.
     *
     * @var array<int, string>
     */
    public array $translatable = [
        BrandingInterface::ATTR_NAME,
    ];

    /**
     * Cast map — enum + JSON + boolean coercion on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        BrandingInterface::ATTR_THEME         => BrandingTheme::class,
        BrandingInterface::ATTR_CSS_VARIABLES => 'array',
        BrandingInterface::ATTR_IS_DEFAULT    => 'boolean',
        BrandingInterface::ATTR_METADATA      => 'array',
        BrandingInterface::ATTR_TRANSLATIONS  => 'array',
    ];

    /**
     * Whether this profile is the tenant's default.
     */
    public function isDefault(): bool
    {
        return (bool) $this->{BrandingInterface::ATTR_IS_DEFAULT};
    }
}
