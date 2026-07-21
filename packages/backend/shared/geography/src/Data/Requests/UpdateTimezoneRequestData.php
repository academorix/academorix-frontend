<?php

declare(strict_types=1);

namespace Stackra\Geography\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;
use Spatie\LaravelData\Optional;

/**
 * Validated payload for `PATCH /api/v1/platform/geography/timezones/{timezone}`.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class UpdateTimezoneRequestData extends Data
{
    public function __construct(
        #[StringType, Max(100), Regex('/^[A-Za-z]+(\/[A-Za-z_\-]+)*$/')]
        public Optional|string $name,

        #[StringType, Regex('/^[A-Za-z]{2}$/')]
        public Optional|string $countryCode,
    ) {
    }
}
