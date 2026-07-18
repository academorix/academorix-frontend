<?php

declare(strict_types=1);

namespace Academorix\Geography\Data\Resources;

use Academorix\Geography\Contracts\Data\LanguageInterface;
use Academorix\Geography\Models\Language;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see Language}.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class LanguageResourceData extends Data
{
    /**
     * @param  int          $id         Numeric primary key.
     * @param  int|null     $countryId  Primary country association.
     * @param  string       $code       ISO-639-1 alpha-2 (lowercase).
     * @param  string       $name       English name.
     * @param  string|null  $native     Native-script name.
     * @param  string|null  $dir        Text direction — `ltr` / `rtl`.
     * @param  bool         $isRtl      Denormalised RTL flag.
     */
    public function __construct(
        public int $id,
        public ?int $countryId,
        public string $code,
        public string $name,
        public ?string $native,
        public ?string $dir,
        public bool $isRtl,
    ) {
    }

    /**
     * Build the DTO from a {@see Language} model.
     */
    public static function fromModel(Language $language): self
    {
        $rawCountry = $language->{LanguageInterface::ATTR_COUNTRY_ID} ?? null;

        return new self(
            id: (int) $language->getKey(),
            countryId: $rawCountry === null ? null : (int) $rawCountry,
            code: (string) $language->{LanguageInterface::ATTR_CODE},
            name: (string) $language->{LanguageInterface::ATTR_NAME},
            native: self::nullableString($language, LanguageInterface::ATTR_NATIVE),
            dir: self::nullableString($language, LanguageInterface::ATTR_DIR),
            isRtl: (bool) ($language->{LanguageInterface::ATTR_IS_RTL} ?? false),
        );
    }

    /**
     * Coerce an attribute to a nullable string; empty strings collapse
     * to null for a clean wire payload.
     */
    private static function nullableString(Language $language, string $key): ?string
    {
        $value = $language->{$key} ?? null;

        if ($value === null || $value === '') {
            return null;
        }

        return (string) $value;
    }
}
