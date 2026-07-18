<?php

declare(strict_types=1);

namespace Academorix\Branding\Data\Requests;

use Academorix\Branding\Enums\BrandingTheme;
use Academorix\Branding\Rules\ValidHexColor;
use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\Rule;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Attributes\Validation\Url;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for `POST /api/v1/tenant/branding` /
 * `POST /api/v1/platform/brandings`.
 *
 * @category Branding
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CreateBrandingRequestData extends Data
{
    /**
     * @param  array<string, string>|null $cssVariables  Free-form
     *   `{ --var: value }` overrides applied at `:root`.
     */
    public function __construct(
        #[Required, StringType, Max(100)]
        public string $name,

        #[Required, Enum(BrandingTheme::class)]
        public BrandingTheme $theme,

        #[StringType, Max(64)]
        public ?string $domainId = null,

        public bool $isDefault = false,

        #[Url, Max(2048)]
        public ?string $logoUrl = null,

        #[Url, Max(2048)]
        public ?string $logoDarkUrl = null,

        #[Url, Max(2048)]
        public ?string $faviconUrl = null,

        #[Rule(new ValidHexColor())]
        public ?string $primaryColor = null,

        #[Rule(new ValidHexColor())]
        public ?string $secondaryColor = null,

        #[Rule(new ValidHexColor())]
        public ?string $accentColor = null,

        #[Rule(new ValidHexColor())]
        public ?string $backgroundColor = null,

        #[Rule(new ValidHexColor())]
        public ?string $surfaceColor = null,

        #[Rule(new ValidHexColor())]
        public ?string $textColor = null,

        #[StringType, Max(500)]
        public ?string $fontStack = null,

        #[Url, Max(2048)]
        public ?string $customFontUrl = null,

        public ?array $cssVariables = null,
    ) {
    }
}
