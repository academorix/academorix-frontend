<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Data\Requests;

use Academorix\Application\Enums\BusinessTypeEnum;
use Academorix\Tenancy\Rules\DnsSafeSlug;
use Academorix\Tenancy\Rules\ReservedSlug;
use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\Rule;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for
 * `POST /api/v1/platform/tenants` — platform-admin creates a tenant
 * on behalf of a customer (bypasses the self-serve flow).
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CreateTenantRequestData extends Data
{
    /**
     * @param  string           $applicationId  Owning Application id.
     * @param  string           $slug           URL-safe tenant identifier.
     * @param  string           $name           Display name.
     * @param  BusinessTypeEnum $businessType   Business type classification.
     * @param  string           $locale         IETF locale tag.
     * @param  string           $timezone       IANA timezone name.
     * @param  string           $currency       ISO-4217 currency code.
     * @param  string           $countryCode    ISO 3166-1 alpha-2 code.
     * @param  string|null      $legalName      Legal registered name.
     */
    public function __construct(
        #[Required, StringType, Max(64)]
        public string $applicationId,

        #[Required, StringType, Rule(new DnsSafeSlug()), Rule(new ReservedSlug())]
        public string $slug,

        #[Required, StringType, Max(200)]
        public string $name,

        #[Required, Enum(BusinessTypeEnum::class)]
        public BusinessTypeEnum $businessType,

        #[Required, StringType, Max(20)]
        public string $locale,

        #[Required, StringType, Max(64)]
        public string $timezone,

        #[Required, StringType, Regex('/^[A-Z]{3}$/')]
        public string $currency,

        #[Required, StringType, Regex('/^[A-Z]{2}$/')]
        public string $countryCode,

        #[StringType, Max(200)]
        public ?string $legalName = null,
    ) {
    }
}
