<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Data;

use Stackra\Entitlements\Contracts\Data\EntitlementInterface;
use Stackra\Entitlements\Enums\EntitlementKind;
use Stackra\Entitlements\Enums\EntitlementPeriod;
use Stackra\Entitlements\Enums\EntitlementSource;
use Stackra\Entitlements\Models\Entitlement;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see Entitlement}.
 *
 * Snake-case on the wire, camelCase in PHP. Carries the resolved
 * limit + used + usage ratio so the tenant admin surface renders a
 * bar chart without a follow-up API call.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class EntitlementData extends Data
{
    /**
     * @param  array<string, mixed>  $value  Kind-dependent shape ({limit, used} / {enabled} / {}).
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $key,
        public EntitlementKind $kind,
        public array $value,
        public EntitlementSource $source,
        public float $usageRatio,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $createdAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $updatedAt,
        public ?EntitlementPeriod $period = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $currentPeriodStartsAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $currentPeriodEndsAt = null,
        public ?string $planId = null,
        public ?string $notes = null,
    ) {
    }

    /**
     * Build from a Model.
     */
    public static function fromModel(Entitlement $entitlement): self
    {
        $rawKind = $entitlement->{EntitlementInterface::ATTR_KIND};
        $kind    = $rawKind instanceof EntitlementKind
            ? $rawKind
            : (EntitlementKind::tryFrom((string) $rawKind) ?? EntitlementKind::Slot);

        $rawSource = $entitlement->{EntitlementInterface::ATTR_SOURCE};
        $source    = $rawSource instanceof EntitlementSource
            ? $rawSource
            : (EntitlementSource::tryFrom((string) $rawSource) ?? EntitlementSource::Plan);

        $rawPeriod = $entitlement->{EntitlementInterface::ATTR_PERIOD};
        $period    = $rawPeriod === null
            ? null
            : ($rawPeriod instanceof EntitlementPeriod
                ? $rawPeriod
                : EntitlementPeriod::tryFrom((string) $rawPeriod));

        /** @var array<string, mixed> $value */
        $value = $entitlement->{EntitlementInterface::ATTR_VALUE} ?? [];

        return new self(
            id: (string) $entitlement->getKey(),
            tenantId: (string) $entitlement->{EntitlementInterface::ATTR_TENANT_ID},
            key: (string) $entitlement->{EntitlementInterface::ATTR_KEY},
            kind: $kind,
            value: $value,
            source: $source,
            usageRatio: $entitlement->usageRatio(),
            createdAt: $entitlement->{EntitlementInterface::ATTR_CREATED_AT},
            updatedAt: $entitlement->{EntitlementInterface::ATTR_UPDATED_AT},
            period: $period,
            currentPeriodStartsAt: $entitlement->{EntitlementInterface::ATTR_CURRENT_PERIOD_STARTS_AT},
            currentPeriodEndsAt: $entitlement->{EntitlementInterface::ATTR_CURRENT_PERIOD_ENDS_AT},
            planId: $entitlement->{EntitlementInterface::ATTR_PLAN_ID},
            notes: $entitlement->{EntitlementInterface::ATTR_NOTES},
        );
    }
}
