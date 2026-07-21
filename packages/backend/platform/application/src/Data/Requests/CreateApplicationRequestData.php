<?php

declare(strict_types=1);

namespace Stackra\Application\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Attributes\Validation\Unique;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated request payload for `POST /api/v1/applications` (platform-admin).
 *
 * @category Application
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CreateApplicationRequestData extends Data
{
    /**
     * @param  string  $slug  URL-safe identifier; unique across the platform.
     * @param  string  $name  Display name; 1..200 chars.
     * @param  string  $centralHost  RFC-1123 hostname; unique across the platform.
     * @param  string  $platformAdminHost  RFC-1123 hostname; unique across the platform.
     * @param  string  $defaultLocale
     * @param  string  $defaultTimezone
     * @param  string  $defaultCurrency
     * @param  string|null  $description  Optional free-form description.
     * @param  string|null  $defaultBusinessType  BusinessTypeEnum case value.
     * @param  array<string, mixed>|null  $config
     * @param  bool|null  $isDefault  When true, flips the current default off.
     */
    public function __construct(
        #[StringType, Min(1), Max(63), Regex('/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/'), Unique('applications', 'slug')]
        public string $slug,

        #[StringType, Min(1), Max(200)]
        public string $name,

        #[StringType, Max(200), Unique('applications', 'central_host')]
        public string $centralHost,

        #[StringType, Max(200), Unique('applications', 'platform_admin_host')]
        public string $platformAdminHost,

        #[StringType, Regex('/^[a-z]{2,3}(-[A-Z]{2})?$/')]
        public string $defaultLocale = 'en',

        #[StringType, Max(64)]
        public string $defaultTimezone = 'UTC',

        #[StringType, Regex('/^[A-Z]{3}$/')]
        public string $defaultCurrency = 'USD',

        #[StringType]
        public ?string $description = null,

        #[StringType, Max(32)]
        public ?string $defaultBusinessType = null,

        public ?array $config = null,

        public ?bool $isDefault = null,
    ) {
    }
}
