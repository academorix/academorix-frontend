<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Data\Requests;

use Academorix\Application\Enums\BusinessTypeEnum;
use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for
 * `PATCH /api/v1/platform/tenants/{tenant}` — platform-admin edit.
 *
 * Every field is optional. `slug` + `application_id` remain deliberately
 * NOT editable — a slug change would break every reference across the
 * platform.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class UpdateTenantRequestData extends Data
{
    /**
     * @param  string|null              $name          Display name.
     * @param  string|null              $legalName     Legal registered name.
     * @param  BusinessTypeEnum|null    $businessType  Business type classification.
     * @param  string|null              $locale        IETF locale.
     * @param  string|null              $timezone      IANA timezone.
     * @param  string|null              $currency      ISO-4217 code.
     * @param  string|null              $countryCode   ISO 3166-1 alpha-2.
     * @param  string|null              $taxId         Tax id.
     */
    public function __construct(
        #[StringType, Max(200)]
        public ?string $name = null,

        #[StringType, Max(200)]
        public ?string $legalName = null,

        #[Enum(BusinessTypeEnum::class)]
        public ?BusinessTypeEnum $businessType = null,

        #[StringType, Max(20)]
        public ?string $locale = null,

        #[StringType, Max(64)]
        public ?string $timezone = null,

        #[StringType, Regex('/^[A-Z]{3}$/')]
        public ?string $currency = null,

        #[StringType, Regex('/^[A-Z]{2}$/')]
        public ?string $countryCode = null,

        #[StringType, Max(64)]
        public ?string $taxId = null,
    ) {
    }
}
