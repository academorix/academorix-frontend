<?php

declare(strict_types=1);

namespace Stackra\Geography\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Ip;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated query payload for `GET /api/v1/geography/geolocate`.
 *
 * Every field is optional — omitting `ip` defaults to the request's
 * source IP; omitting `locale` defaults to the app's current locale.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class GeolocateRequestData extends Data
{
    /**
     * @param  string|null  $ip      IPv4 / IPv6 address. Defaults to the request source IP.
     * @param  string|null  $locale  BCP-47 locale for country-name translation.
     */
    public function __construct(
        #[StringType, Ip]
        public ?string $ip = null,

        #[StringType, Max(12)]
        public ?string $locale = null,
    ) {
    }
}
