<?php

declare(strict_types=1);

namespace Academorix\Geography\Data\Resources;

use Academorix\Geography\Contracts\Data\TimezoneInterface;
use Academorix\Geography\Models\Timezone;
use DateTimeImmutable;
use DateTimeZone;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see Timezone}.
 *
 * Adds two computed fields — `current_utc_offset_minutes` +
 * `current_utc_offset_iso` — resolved from PHP's `DateTimeZone` at
 * response build time so callers can render "GMT+2:00" without
 * consulting the IANA DB themselves.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class TimezoneResourceData extends Data
{
    /**
     * @param  int     $id                        Numeric primary key.
     * @param  int     $countryId                 Parent country FK.
     * @param  string  $name                      IANA name (e.g. `Europe/Paris`).
     * @param  string  $countryCode               ISO-3166 alpha-2 of the parent country.
     * @param  int     $currentUtcOffsetMinutes   Signed minutes offset from UTC right now.
     * @param  string  $currentUtcOffsetIso       ISO-8601 offset format (e.g. `+02:00`).
     */
    public function __construct(
        public int $id,
        public int $countryId,
        public string $name,
        public string $countryCode,
        public int $currentUtcOffsetMinutes,
        public string $currentUtcOffsetIso,
    ) {
    }

    /**
     * Build the DTO from a {@see Timezone} model.
     */
    public static function fromModel(Timezone $timezone): self
    {
        $name = (string) $timezone->{TimezoneInterface::ATTR_NAME};

        [$offsetMinutes, $offsetIso] = self::computeUtcOffset($name);

        return new self(
            id: (int) $timezone->getKey(),
            countryId: (int) $timezone->{TimezoneInterface::ATTR_COUNTRY_ID},
            name: $name,
            countryCode: (string) $timezone->{TimezoneInterface::ATTR_COUNTRY_CODE},
            currentUtcOffsetMinutes: $offsetMinutes,
            currentUtcOffsetIso: $offsetIso,
        );
    }

    /**
     * Resolve the current UTC offset for an IANA name.
     *
     * Returns a `[minutes, iso]` pair. Falls back to `(0, '+00:00')`
     * when the IANA name is invalid (should never happen given
     * observer-side validation, but the DTO stays crash-proof).
     *
     * @return array{0: int, 1: string}
     */
    private static function computeUtcOffset(string $name): array
    {
        try {
            $tz     = new DateTimeZone($name);
            $now    = new DateTimeImmutable('now', $tz);
            $offset = $tz->getOffset($now);
        } catch (\Throwable) {
            // Invalid IANA name — return UTC as a defensive default.
            return [0, '+00:00'];
        }

        $minutes = (int) ($offset / 60);
        $sign    = $minutes >= 0 ? '+' : '-';
        $abs     = \abs($minutes);
        $hours   = \intdiv($abs, 60);
        $mins    = $abs % 60;
        $iso     = \sprintf('%s%02d:%02d', $sign, $hours, $mins);

        return [$minutes, $iso];
    }
}
