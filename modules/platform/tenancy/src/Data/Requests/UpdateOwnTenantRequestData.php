<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for `PATCH /api/current-tenant`.
 *
 * Tenant admin editing their own tenant. Every field is optional —
 * `slug`, `application_id`, and `status` are deliberately NOT editable
 * from this action (platform-admin only).
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class UpdateOwnTenantRequestData extends Data
{
    /**
     * @param  string|null   $name                Display name.
     * @param  string|null   $legalName           Legal registered name.
     * @param  string|null   $locale              IETF locale tag.
     * @param  string|null   $timezone            IANA timezone.
     * @param  string|null   $currency            ISO-4217 currency (3 letters).
     * @param  string|null   $countryCode         ISO 3166-1 alpha-2 code.
     * @param  string|null   $taxId               Tax id (VAT / EIN).
     * @param  string|null   $primaryBrandingId   FK to the promoted Branding row.
     * @param  array<string, mixed>|null $settings  Tenant-editable settings bag.
     * @param  array<string, string>|null $terminology  Terminology overrides.
     */
    public function __construct(
        #[StringType, Max(200)]
        public ?string $name = null,

        #[StringType, Max(200)]
        public ?string $legalName = null,

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

        #[StringType, Max(64)]
        public ?string $primaryBrandingId = null,

        public ?array $settings = null,

        public ?array $terminology = null,
    ) {
    }
}
