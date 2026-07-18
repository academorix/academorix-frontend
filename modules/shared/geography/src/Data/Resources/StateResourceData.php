<?php

declare(strict_types=1);

namespace Academorix\Geography\Data\Resources;

use Academorix\Geography\Contracts\Data\StateInterface;
use Academorix\Geography\Models\State;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see State}.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class StateResourceData extends Data
{
    /**
     * @param  int          $id           Numeric primary key.
     * @param  int          $countryId    Parent country FK.
     * @param  string       $name         English state name.
     * @param  string       $countryCode  ISO-3166 alpha-2 of the parent country.
     * @param  string|null  $stateCode    ISO-3166-2 code (e.g. US-CA, FR-75).
     * @param  string|null  $type         state / province / region / district / territory.
     * @param  string|null  $latitude     Approximate latitude.
     * @param  string|null  $longitude    Approximate longitude.
     */
    public function __construct(
        public int $id,
        public int $countryId,
        public string $name,
        public string $countryCode,
        public ?string $stateCode,
        public ?string $type,
        public ?string $latitude,
        public ?string $longitude,
    ) {
    }

    /**
     * Build the DTO from a {@see State} model.
     */
    public static function fromModel(State $state): self
    {
        return new self(
            id: (int) $state->getKey(),
            countryId: (int) $state->{StateInterface::ATTR_COUNTRY_ID},
            name: (string) $state->{StateInterface::ATTR_NAME},
            countryCode: (string) $state->{StateInterface::ATTR_COUNTRY_CODE},
            stateCode: self::nullableString($state, StateInterface::ATTR_STATE_CODE),
            type: self::nullableString($state, StateInterface::ATTR_TYPE),
            latitude: self::nullableString($state, StateInterface::ATTR_LATITUDE),
            longitude: self::nullableString($state, StateInterface::ATTR_LONGITUDE),
        );
    }

    /**
     * Coerce an attribute to a nullable string; empty strings collapse
     * to null for a clean wire payload.
     */
    private static function nullableString(State $state, string $key): ?string
    {
        $value = $state->{$key} ?? null;

        if ($value === null || $value === '') {
            return null;
        }

        return (string) $value;
    }
}
