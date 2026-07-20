<?php

declare(strict_types=1);

namespace Academorix\Geography\Data\Resources;

use Academorix\Geography\Contracts\Data\CityInterface;
use Academorix\Geography\Models\City;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see City}.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class CityResourceData extends Data
{
    /**
     * @param  int          $id           Numeric primary key.
     * @param  int          $countryId    Parent country FK.
     * @param  int          $stateId      Parent state FK.
     * @param  string       $name         English city name.
     * @param  string       $countryCode  ISO-3166 alpha-2 of the parent country.
     * @param  string|null  $stateCode    ISO-3166-2 code of the parent state.
     * @param  string|null  $latitude     Approximate latitude.
     * @param  string|null  $longitude    Approximate longitude.
     */
    public function __construct(
        public int $id,
        public int $countryId,
        public int $stateId,
        public string $name,
        public string $countryCode,
        public ?string $stateCode,
        public ?string $latitude,
        public ?string $longitude,
    ) {
    }

    /**
     * Build the DTO from a {@see City} model.
     */
    public static function fromModel(City $city): self
    {
        return new self(
            id: (int) $city->getKey(),
            countryId: (int) $city->{CityInterface::ATTR_COUNTRY_ID},
            stateId: (int) $city->{CityInterface::ATTR_STATE_ID},
            name: (string) $city->{CityInterface::ATTR_NAME},
            countryCode: (string) $city->{CityInterface::ATTR_COUNTRY_CODE},
            stateCode: self::nullableString($city, CityInterface::ATTR_STATE_CODE),
            latitude: self::nullableString($city, CityInterface::ATTR_LATITUDE),
            longitude: self::nullableString($city, CityInterface::ATTR_LONGITUDE),
        );
    }

    /**
     * Coerce an attribute to a nullable string; empty strings collapse
     * to null for a clean wire payload.
     */
    private static function nullableString(City $city, string $key): ?string
    {
        $value = $city->{$key} ?? null;

        if ($value === null || $value === '') {
            return null;
        }

        return (string) $value;
    }
}
