<?php

declare(strict_types=1);

namespace Academorix\Application\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;
use Spatie\LaravelData\Optional;

/**
 * Validated PATCH payload for `PATCH /api/v1/applications/{id}`.
 *
 * Partial-update semantics — every property is `T|Optional|null` with
 * an `Optional` sentinel default. `toArray()` strips `Optional`
 * values so unset fields never clear server-side state.
 *
 * @category Application
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class UpdateApplicationRequestData extends Data
{
    /**
     * @param  Optional|string       $name
     * @param  Optional|string|null  $description
     * @param  Optional|string       $centralHost
     * @param  Optional|string       $platformAdminHost
     * @param  Optional|string       $defaultLocale
     * @param  Optional|string       $defaultTimezone
     * @param  Optional|string       $defaultCurrency
     * @param  Optional|string|null  $defaultBusinessType
     * @param  Optional|array<string, mixed>|null  $config
     * @param  Optional|bool         $isDefault
     */
    public function __construct(
        #[StringType, Min(1), Max(200)]
        public Optional|string $name = new Optional(),

        #[StringType]
        public Optional|string|null $description = new Optional(),

        #[StringType, Max(200)]
        public Optional|string $centralHost = new Optional(),

        #[StringType, Max(200)]
        public Optional|string $platformAdminHost = new Optional(),

        #[StringType, Regex('/^[a-z]{2,3}(-[A-Z]{2})?$/')]
        public Optional|string $defaultLocale = new Optional(),

        #[StringType, Max(64)]
        public Optional|string $defaultTimezone = new Optional(),

        #[StringType, Regex('/^[A-Z]{3}$/')]
        public Optional|string $defaultCurrency = new Optional(),

        #[StringType, Max(32)]
        public Optional|string|null $defaultBusinessType = new Optional(),

        public Optional|array|null $config = new Optional(),

        public Optional|bool $isDefault = new Optional(),
    ) {
    }
}
