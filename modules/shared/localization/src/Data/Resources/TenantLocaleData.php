<?php

declare(strict_types=1);

namespace Academorix\Localization\Data\Resources;

use Academorix\Localization\Contracts\Data\TenantLocaleInterface;
use Academorix\Localization\Models\TenantLocale;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see TenantLocale}.
 *
 * Embeds the nested {@see PlatformLanguageData} under
 * `language` for backward-compatible client consumption.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class TenantLocaleData extends Data
{
    /**
     * @param  string                   $id                    `tll_<ulid>`.
     * @param  string                   $tenantId              Owning tenant.
     * @param  string                   $languageId            Platform-language id.
     * @param  bool                     $isDefault             Row is the tenant's default.
     * @param  bool                     $isFallback            Row is the tenant's fallback.
     * @param  bool                     $isActive              Row is active.
     * @param  string|null              $autoTranslateDriver   Optional driver override.
     * @param  float|null               $minQualityScore       Optional quality floor.
     * @param  PlatformLanguageData|null $language              Embedded language resource.
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $languageId,
        public bool $isDefault,
        public bool $isFallback,
        public bool $isActive,
        public ?string $autoTranslateDriver,
        public ?float $minQualityScore,
        public ?PlatformLanguageData $language,
    ) {
    }

    /**
     * Build the DTO from a {@see TenantLocale} model.
     */
    public static function fromModel(TenantLocale $tenantLocale): self
    {
        $language = $tenantLocale->relationLoaded('language')
            ? $tenantLocale->language
            : null;

        return new self(
            id: (string) $tenantLocale->getKey(),
            tenantId: (string) $tenantLocale->{TenantLocaleInterface::ATTR_TENANT_ID},
            languageId: (string) $tenantLocale->{TenantLocaleInterface::ATTR_LANGUAGE_ID},
            isDefault: (bool) $tenantLocale->{TenantLocaleInterface::ATTR_IS_DEFAULT},
            isFallback: (bool) $tenantLocale->{TenantLocaleInterface::ATTR_IS_FALLBACK},
            isActive: (bool) $tenantLocale->{TenantLocaleInterface::ATTR_IS_ACTIVE},
            autoTranslateDriver: $tenantLocale->{TenantLocaleInterface::ATTR_AUTO_TRANSLATE_DRIVER}?->value,
            minQualityScore: $tenantLocale->{TenantLocaleInterface::ATTR_MIN_QUALITY_SCORE},
            language: $language !== null ? PlatformLanguageData::fromModel($language) : null,
        );
    }
}
