<?php

declare(strict_types=1);

namespace Academorix\Localization\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\BooleanType;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Numeric;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;
use Spatie\LaravelData\Optional;

/**
 * Validated payload for `PATCH /api/v1/tenant-locales/{tenantLocale}`.
 *
 * Every field is optional (`Optional` type) — the observer normalises
 * on save.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class UpdateTenantLocaleRequestData extends Data
{
    /**
     * @param  bool|Optional             $isDefault             Toggle default flag.
     * @param  bool|Optional             $isFallback            Toggle fallback flag.
     * @param  bool|Optional             $isActive              Toggle active flag.
     * @param  string|null|Optional      $autoTranslateDriver   Per-locale driver override.
     * @param  float|null|Optional       $minQualityScore       Quality floor.
     */
    public function __construct(
        #[BooleanType]
        public bool|Optional $isDefault = new Optional(),

        #[BooleanType]
        public bool|Optional $isFallback = new Optional(),

        #[BooleanType]
        public bool|Optional $isActive = new Optional(),

        #[StringType, Max(32)]
        public string|null|Optional $autoTranslateDriver = new Optional(),

        #[Numeric]
        public float|null|Optional $minQualityScore = new Optional(),
    ) {
    }
}
