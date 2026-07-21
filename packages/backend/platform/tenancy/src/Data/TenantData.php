<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Data;

use Stackra\Application\Enums\BusinessTypeEnum;
use Stackra\Tenancy\Contracts\Data\TenantInterface;
use Stackra\Tenancy\Enums\TenantStatus;
use Stackra\Tenancy\Models\Tenant;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see Tenant}.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class TenantData extends Data
{
    /**
     * @param  string        $id             `ten_<ulid>`.
     * @param  string        $applicationId  Owning Application id.
     * @param  string        $slug           URL-safe subdomain identifier.
     * @param  string        $name           Display name.
     * @param  TenantStatus  $status         Lifecycle state.
     * @param  string        $locale         IETF locale.
     * @param  string        $timezone       IANA timezone.
     * @param  string        $currency       ISO-4217 currency code.
     * @param  string        $countryCode    ISO 3166-1 alpha-2 country code.
     * @param  bool          $isSystem       Platform-owned row.
     * @param  \DateTimeInterface $createdAt Row creation timestamp.
     * @param  \DateTimeInterface $updatedAt Last mutation timestamp.
     * @param  string|null   $legalName      Legal registered name.
     * @param  BusinessTypeEnum|null $businessType  Business type classification.
     * @param  string|null   $taxId          Tax identifier (VAT / EIN / …).
     * @param  string|null   $primaryBrandingId  FK to the tenant's primary Branding row.
     * @param  array<string, mixed>|null $branding  Denormalised branding snapshot.
     * @param  array<string, mixed>|null $settings  Tenant-editable settings bag.
     * @param  list<string>|null $features    Enabled feature slugs.
     * @param  array<string, string>|null $terminology  Terminology overrides.
     * @param  \DateTimeInterface|null $trialEndsAt   Trial expiry.
     * @param  \DateTimeInterface|null $suspendedAt   Suspension timestamp.
     * @param  string|null    $suspensionReason  Free-form reason.
     * @param  \DateTimeInterface|null $graceEndsAt   Grace-period end.
     * @param  \DateTimeInterface|null $archivedAt    Archived-at timestamp.
     * @param  \DateTimeInterface|null $deletedAt     Soft-delete marker.
     */
    public function __construct(
        public string $id,
        public string $applicationId,
        public string $slug,
        public string $name,
        public TenantStatus $status,
        public string $locale,
        public string $timezone,
        public string $currency,
        public string $countryCode,
        public bool $isSystem,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $createdAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $updatedAt,
        public ?string $legalName = null,
        public ?BusinessTypeEnum $businessType = null,
        public ?string $taxId = null,
        public ?string $primaryBrandingId = null,
        public ?array $branding = null,
        public ?array $settings = null,
        public ?array $features = null,
        public ?array $terminology = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $trialEndsAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $suspendedAt = null,
        public ?string $suspensionReason = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $graceEndsAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $archivedAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $deletedAt = null,
    ) {
    }

    /**
     * Build from a Model.
     */
    public static function fromModel(Tenant $tenant): self
    {
        return new self(
            id: (string) $tenant->getKey(),
            applicationId: (string) $tenant->{TenantInterface::ATTR_APPLICATION_ID},
            slug: (string) $tenant->{TenantInterface::ATTR_SLUG},
            name: (string) $tenant->{TenantInterface::ATTR_NAME},
            status: $tenant->{TenantInterface::ATTR_STATUS} ?? TenantStatus::Trialing,
            locale: (string) $tenant->{TenantInterface::ATTR_LOCALE},
            timezone: (string) $tenant->{TenantInterface::ATTR_TIMEZONE},
            currency: (string) $tenant->{TenantInterface::ATTR_CURRENCY},
            countryCode: (string) ($tenant->{TenantInterface::ATTR_COUNTRY_CODE} ?? ''),
            isSystem: (bool) $tenant->{TenantInterface::ATTR_IS_SYSTEM},
            createdAt: $tenant->{TenantInterface::ATTR_CREATED_AT},
            updatedAt: $tenant->{TenantInterface::ATTR_UPDATED_AT},
            legalName: $tenant->{TenantInterface::ATTR_LEGAL_NAME},
            businessType: $tenant->{TenantInterface::ATTR_BUSINESS_TYPE},
            taxId: $tenant->{TenantInterface::ATTR_TAX_ID},
            primaryBrandingId: $tenant->{TenantInterface::ATTR_PRIMARY_BRANDING_ID},
            branding: $tenant->{TenantInterface::ATTR_BRANDING},
            settings: $tenant->{TenantInterface::ATTR_SETTINGS},
            features: $tenant->{TenantInterface::ATTR_FEATURES},
            terminology: $tenant->{TenantInterface::ATTR_TERMINOLOGY},
            trialEndsAt: $tenant->{TenantInterface::ATTR_TRIAL_ENDS_AT},
            suspendedAt: $tenant->{TenantInterface::ATTR_SUSPENDED_AT},
            suspensionReason: $tenant->{TenantInterface::ATTR_SUSPENSION_REASON},
            graceEndsAt: $tenant->{TenantInterface::ATTR_GRACE_ENDS_AT},
            archivedAt: $tenant->{TenantInterface::ATTR_ARCHIVED_AT},
            deletedAt: $tenant->{TenantInterface::ATTR_DELETED_AT},
        );
    }
}
