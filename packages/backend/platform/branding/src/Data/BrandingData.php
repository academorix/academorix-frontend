<?php

declare(strict_types=1);

namespace Stackra\Branding\Data;

use Stackra\Branding\Contracts\Data\BrandingInterface;
use Stackra\Branding\Enums\BrandingTheme;
use Stackra\Branding\Models\Branding;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see Branding}.
 *
 * `metadata` + userstamp columns are hidden by omission (matches the
 * blueprint's `x-wire.hidden` list).
 *
 * @category Branding
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class BrandingData extends Data
{
    /**
     * @param  string                    $id                `brd_<ulid>`.
     * @param  string                    $tenantId          Owning tenant.
     * @param  string                    $name              Display name (active-locale projection).
     * @param  BrandingTheme             $theme             light / dark / auto.
     * @param  bool                      $isDefault         Tenant default flag.
     * @param  \DateTimeInterface        $createdAt         Row creation.
     * @param  \DateTimeInterface        $updatedAt         Last mutation.
     * @param  string|null               $domainId          Domain binding (nullable).
     * @param  string|null               $logoUrl           Primary logo URL.
     * @param  string|null               $logoDarkUrl       Dark-mode alternate logo.
     * @param  string|null               $faviconUrl        Favicon URL.
     * @param  string|null               $primaryColor      Primary brand color (#RRGGBB).
     * @param  string|null               $secondaryColor    Secondary brand color.
     * @param  string|null               $accentColor       Accent color.
     * @param  string|null               $backgroundColor   Background color.
     * @param  string|null               $surfaceColor      Surface color.
     * @param  string|null               $textColor         Text color.
     * @param  string|null               $fontStack         Font stack.
     * @param  string|null               $customFontUrl     Custom web-font URL.
     * @param  array<string, string>|null $cssVariables     CSS custom-property overrides.
     * @param  \DateTimeInterface|null   $deletedAt         Soft-delete marker.
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $name,
        public BrandingTheme $theme,
        public bool $isDefault,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $createdAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $updatedAt,
        public ?string $domainId = null,
        public ?string $logoUrl = null,
        public ?string $logoDarkUrl = null,
        public ?string $faviconUrl = null,
        public ?string $primaryColor = null,
        public ?string $secondaryColor = null,
        public ?string $accentColor = null,
        public ?string $backgroundColor = null,
        public ?string $surfaceColor = null,
        public ?string $textColor = null,
        public ?string $fontStack = null,
        public ?string $customFontUrl = null,
        public ?array $cssVariables = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $deletedAt = null,
    ) {
    }

    /**
     * Build from a Model.
     */
    public static function fromModel(Branding $branding): self
    {
        $themeValue = $branding->{BrandingInterface::ATTR_THEME};
        $theme = $themeValue instanceof BrandingTheme
            ? $themeValue
            : (BrandingTheme::tryFrom((string) $themeValue) ?? BrandingTheme::Auto);

        return new self(
            id: (string) $branding->getKey(),
            tenantId: (string) $branding->{BrandingInterface::ATTR_TENANT_ID},
            name: (string) $branding->{BrandingInterface::ATTR_NAME},
            theme: $theme,
            isDefault: (bool) $branding->{BrandingInterface::ATTR_IS_DEFAULT},
            createdAt: $branding->{BrandingInterface::ATTR_CREATED_AT},
            updatedAt: $branding->{BrandingInterface::ATTR_UPDATED_AT},
            domainId: $branding->{BrandingInterface::ATTR_DOMAIN_ID},
            logoUrl: $branding->{BrandingInterface::ATTR_LOGO_URL},
            logoDarkUrl: $branding->{BrandingInterface::ATTR_LOGO_DARK_URL},
            faviconUrl: $branding->{BrandingInterface::ATTR_FAVICON_URL},
            primaryColor: $branding->{BrandingInterface::ATTR_PRIMARY_COLOR},
            secondaryColor: $branding->{BrandingInterface::ATTR_SECONDARY_COLOR},
            accentColor: $branding->{BrandingInterface::ATTR_ACCENT_COLOR},
            backgroundColor: $branding->{BrandingInterface::ATTR_BACKGROUND_COLOR},
            surfaceColor: $branding->{BrandingInterface::ATTR_SURFACE_COLOR},
            textColor: $branding->{BrandingInterface::ATTR_TEXT_COLOR},
            fontStack: $branding->{BrandingInterface::ATTR_FONT_STACK},
            customFontUrl: $branding->{BrandingInterface::ATTR_CUSTOM_FONT_URL},
            cssVariables: $branding->{BrandingInterface::ATTR_CSS_VARIABLES},
            deletedAt: $branding->{BrandingInterface::ATTR_DELETED_AT},
        );
    }
}
