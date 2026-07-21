<?php

declare(strict_types=1);

namespace Stackra\Geography\Data\Resources;

use Stackra\Geography\Contracts\Data\CountryInterface;
use Stackra\Geography\Models\Country;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see Country}.
 *
 * Exposes the vendor's public catalog fields plus the computed
 * `localized_name` derived from the `HasWorldLocalizedName` trait
 * against the request's active locale.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class CountryResourceData extends Data
{
    /**
     * @param  int          $id             Numeric primary key.
     * @param  string       $iso2           ISO-3166 alpha-2 (uppercase).
     * @param  string|null  $iso3           ISO-3166 alpha-3 (uppercase).
     * @param  string       $name           English display name.
     * @param  string       $localizedName  Locale-aware display name.
     * @param  string|null  $native         Local-script name.
     * @param  string|null  $phoneCode      E.164 country calling code.
     * @param  string|null  $region         UN M49 region.
     * @param  string|null  $subregion      UN M49 subregion.
     * @param  string|null  $latitude       Approximate latitude.
     * @param  string|null  $longitude      Approximate longitude.
     * @param  string|null  $emoji          Flag emoji character.
     * @param  string|null  $emojiU         Unicode escape for the flag.
     * @param  int          $status         1 = active, 0 = deprecated.
     */
    public function __construct(
        public int $id,
        public string $iso2,
        public ?string $iso3,
        public string $name,
        public string $localizedName,
        public ?string $native,
        public ?string $phoneCode,
        public ?string $region,
        public ?string $subregion,
        public ?string $latitude,
        public ?string $longitude,
        public ?string $emoji,
        public ?string $emojiU,
        public int $status,
    ) {
    }

    /**
     * Build the DTO from a {@see Country} model.
     */
    public static function fromModel(Country $country): self
    {
        return new self(
            id: (int) $country->getKey(),
            iso2: (string) $country->{CountryInterface::ATTR_ISO2},
            iso3: self::nullableString($country, CountryInterface::ATTR_ISO3),
            name: (string) $country->{CountryInterface::ATTR_NAME},
            localizedName: $country->resolveLocalizedName(),
            native: self::nullableString($country, CountryInterface::ATTR_NATIVE),
            phoneCode: self::nullableString($country, CountryInterface::ATTR_PHONE_CODE),
            region: self::nullableString($country, CountryInterface::ATTR_REGION),
            subregion: self::nullableString($country, CountryInterface::ATTR_SUBREGION),
            latitude: self::nullableString($country, CountryInterface::ATTR_LATITUDE),
            longitude: self::nullableString($country, CountryInterface::ATTR_LONGITUDE),
            emoji: self::nullableString($country, CountryInterface::ATTR_EMOJI),
            emojiU: self::nullableString($country, CountryInterface::ATTR_EMOJI_U),
            status: (int) ($country->{CountryInterface::ATTR_STATUS} ?? 1),
        );
    }

    /**
     * Coerce an attribute to a nullable string; empty strings collapse
     * to null for a clean wire payload.
     */
    private static function nullableString(Country $country, string $key): ?string
    {
        $value = $country->{$key} ?? null;

        if ($value === null || $value === '') {
            return null;
        }

        return (string) $value;
    }
}
