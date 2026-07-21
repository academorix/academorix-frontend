<?php

declare(strict_types=1);

namespace Stackra\Subscription\Data;

use Stackra\Subscription\Contracts\Data\PlanInterface;
use Stackra\Subscription\Enums\BillingCycle;
use Stackra\Subscription\Enums\BillingMode;
use Stackra\Subscription\Enums\PlanTier;
use Stackra\Subscription\Models\Plan;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see Plan}.
 *
 * Snake-case on the wire, camelCase in PHP. Non-public fields (`is_system`)
 * are still returned — the audience is authenticated tenant users or
 * platform admins, both of whom are allowed to know.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class PlanData extends Data
{
    /**
     * @param  array<string, mixed>  $defaultEntitlements  Kind-map keyed by entitlement.
     * @param  list<string>          $includedFeatures     Feature keys bundled with this plan.
     */
    public function __construct(
        public string $id,
        public string $applicationId,
        public string $key,
        public string $name,
        public PlanTier $tier,
        public BillingCycle $billingCycle,
        public BillingMode $billingMode,
        public int $priceMicroUnits,
        public string $currency,
        public int $trialDays,
        public array $defaultEntitlements,
        public array $includedFeatures,
        public bool $isSystem,
        public bool $isPublic,
        public bool $isDeprecated,
        public int $sortOrder,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $createdAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $updatedAt,
        public ?string $description = null,
        public ?string $providerPriceId = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $archivedAt = null,
    ) {
    }

    /**
     * Build the DTO from a Plan model.
     */
    public static function fromModel(Plan $plan): self
    {
        $tier = $plan->{PlanInterface::ATTR_TIER};
        $tier = $tier instanceof PlanTier
            ? $tier
            : (PlanTier::tryFrom((string) $tier) ?? PlanTier::Custom);

        $cycle = $plan->{PlanInterface::ATTR_BILLING_CYCLE};
        $cycle = $cycle instanceof BillingCycle
            ? $cycle
            : (BillingCycle::tryFrom((string) $cycle) ?? BillingCycle::Monthly);

        $mode = $plan->{PlanInterface::ATTR_BILLING_MODE};
        $mode = $mode instanceof BillingMode
            ? $mode
            : (BillingMode::tryFrom((string) $mode) ?? BillingMode::Cashier);

        /** @var array<string, mixed> $entitlements */
        $entitlements = $plan->{PlanInterface::ATTR_DEFAULT_ENTITLEMENTS} ?? [];
        /** @var list<string> $features */
        $features = $plan->{PlanInterface::ATTR_INCLUDED_FEATURES} ?? [];

        return new self(
            id: (string) $plan->getKey(),
            applicationId: (string) $plan->{PlanInterface::ATTR_APPLICATION_ID},
            key: (string) $plan->{PlanInterface::ATTR_KEY},
            name: (string) $plan->{PlanInterface::ATTR_NAME},
            tier: $tier,
            billingCycle: $cycle,
            billingMode: $mode,
            priceMicroUnits: (int) $plan->{PlanInterface::ATTR_PRICE_MICRO_UNITS},
            currency: (string) $plan->{PlanInterface::ATTR_CURRENCY},
            trialDays: (int) $plan->{PlanInterface::ATTR_TRIAL_DAYS},
            defaultEntitlements: $entitlements,
            includedFeatures: $features,
            isSystem: (bool) $plan->{PlanInterface::ATTR_IS_SYSTEM},
            isPublic: (bool) $plan->{PlanInterface::ATTR_IS_PUBLIC},
            isDeprecated: (bool) $plan->{PlanInterface::ATTR_IS_DEPRECATED},
            sortOrder: (int) $plan->{PlanInterface::ATTR_SORT_ORDER},
            createdAt: $plan->{PlanInterface::ATTR_CREATED_AT},
            updatedAt: $plan->{PlanInterface::ATTR_UPDATED_AT},
            description: self::nullableString($plan, PlanInterface::ATTR_DESCRIPTION),
            providerPriceId: self::nullableString($plan, PlanInterface::ATTR_PROVIDER_PRICE_ID),
            archivedAt: $plan->{PlanInterface::ATTR_ARCHIVED_AT},
        );
    }

    /**
     * Read a nullable string attribute; empty strings collapse to
     * null for a clean wire payload.
     */
    private static function nullableString(Plan $plan, string $key): ?string
    {
        $value = $plan->{$key} ?? null;
        if ($value === null || $value === '') {
            return null;
        }

        return (string) $value;
    }
}
