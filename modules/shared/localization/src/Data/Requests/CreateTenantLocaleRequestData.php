<?php

declare(strict_types=1);

namespace Academorix\Localization\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\BooleanType;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for `POST /api/v1/tenant-locales/{language}`.
 *
 * The `language` route parameter carries the platform-language id;
 * this DTO covers the optional preferences a tenant admin sets at
 * enablement time.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CreateTenantLocaleRequestData extends Data
{
    /**
     * @param  bool         $isDefault             Promote to the tenant's default locale.
     * @param  bool         $isFallback            Promote to the tenant's fallback locale.
     * @param  bool         $isActive              Enable the locale (default: true).
     * @param  string|null  $autoTranslateDriver   Per-locale driver override (openai, google, deepl, ...).
     * @param  float|null   $minQualityScore       Quality-score floor for driver output.
     */
    public function __construct(
        #[BooleanType]
        public bool $isDefault = false,

        #[BooleanType]
        public bool $isFallback = false,

        #[BooleanType]
        public bool $isActive = true,

        #[StringType, Max(32)]
        public ?string $autoTranslateDriver = null,

        public ?float $minQualityScore = null,
    ) {
    }
}
