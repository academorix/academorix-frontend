<?php

declare(strict_types=1);

namespace Stackra\Localization\Data\Resources;

use Stackra\Localization\Contracts\Data\TranslationInterface;
use Stackra\Localization\Models\Translation;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see Translation}.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class TranslationData extends Data
{
    /**
     * @param  string                    $id             `trn_<ulid>`.
     * @param  string|null               $tenantId       Owning tenant or null for platform default.
     * @param  string                    $languageId     Platform-language id.
     * @param  string|null               $translationJobId Bulk-job parent (null on manual / import rows).
     * @param  string                    $namespace      Namespace bucket.
     * @param  string                    $group          Group name.
     * @param  string                    $key            Translation key.
     * @param  string                    $localeCode     Denormalised BCP-47 code.
     * @param  string                    $value          The translated string.
     * @param  string                    $source         Row source (manual, machine, import).
     * @param  string|null               $provider       Driver identifier (machine rows only).
     * @param  float|null                $qualityScore   Driver-reported quality.
     * @param  bool                      $isVerified     Row was human-reviewed.
     * @param  bool                      $isStale        Row's source drifted.
     * @param  \DateTimeInterface|null   $verifiedAt     When the row was verified.
     * @param  \DateTimeInterface        $createdAt      Row creation.
     * @param  \DateTimeInterface        $updatedAt      Row update.
     */
    public function __construct(
        public string $id,
        public ?string $tenantId,
        public string $languageId,
        public ?string $translationJobId,
        public string $namespace,
        public string $group,
        public string $key,
        public string $localeCode,
        public string $value,
        public string $source,
        public ?string $provider,
        public ?float $qualityScore,
        public bool $isVerified,
        public bool $isStale,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $verifiedAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $createdAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $updatedAt,
    ) {
    }

    /**
     * Build the DTO from a {@see Translation} model.
     */
    public static function fromModel(Translation $translation): self
    {
        $sourceEnum = $translation->{TranslationInterface::ATTR_SOURCE};
        $sourceValue = \is_object($sourceEnum) && \property_exists($sourceEnum, 'value')
            ? (string) $sourceEnum->value
            : (string) $sourceEnum;

        return new self(
            id: (string) $translation->getKey(),
            tenantId: $translation->{TranslationInterface::ATTR_TENANT_ID},
            languageId: (string) $translation->{TranslationInterface::ATTR_LANGUAGE_ID},
            translationJobId: $translation->{TranslationInterface::ATTR_TRANSLATION_JOB_ID},
            namespace: (string) $translation->{TranslationInterface::ATTR_NAMESPACE},
            group: (string) $translation->{TranslationInterface::ATTR_GROUP},
            key: (string) $translation->{TranslationInterface::ATTR_KEY},
            localeCode: (string) $translation->{TranslationInterface::ATTR_LOCALE_CODE},
            value: (string) $translation->{TranslationInterface::ATTR_VALUE},
            source: $sourceValue,
            provider: $translation->{TranslationInterface::ATTR_PROVIDER},
            qualityScore: $translation->{TranslationInterface::ATTR_QUALITY_SCORE},
            isVerified: (bool) $translation->{TranslationInterface::ATTR_IS_VERIFIED},
            isStale: (bool) $translation->{TranslationInterface::ATTR_IS_STALE},
            verifiedAt: $translation->{TranslationInterface::ATTR_VERIFIED_AT},
            createdAt: $translation->{TranslationInterface::ATTR_CREATED_AT},
            updatedAt: $translation->{TranslationInterface::ATTR_UPDATED_AT},
        );
    }
}
