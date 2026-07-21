<?php

declare(strict_types=1);

namespace Stackra\Subscription\Data\Requests;

use Stackra\Subscription\Enums\BillingCycle;
use Stackra\Subscription\Enums\BillingMode;
use Stackra\Subscription\Enums\PlanTier;
use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\ArrayType;
use Spatie\LaravelData\Attributes\Validation\BooleanType;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\IntegerType;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for `POST /api/v1/platform/plans`.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CreatePlanRequestData extends Data
{
    /**
     * @param  array<string, mixed>  $defaultEntitlements  Entitlement kind map.
     * @param  list<string>          $includedFeatures     Feature keys included.
     */
    public function __construct(
        #[Required, StringType, Max(64)]
        public string $applicationId,

        #[Required, StringType, Max(100), Regex('/^[a-z][a-z0-9_]{0,99}$/')]
        public string $key,

        #[Required, StringType, Max(200)]
        public string $name,

        #[Required, Enum(PlanTier::class)]
        public string $tier,

        #[Required, Enum(BillingCycle::class)]
        public string $billingCycle,

        #[Required, IntegerType, Min(0)]
        public int $priceMicroUnits,

        #[Required, StringType, Max(3)]
        public string $currency,

        #[Required, IntegerType, Min(0), Max(90)]
        public int $trialDays,

        #[Enum(BillingMode::class)]
        public string $billingMode = 'cashier',

        #[StringType]
        public ?string $description = null,

        #[StringType, Max(128)]
        public ?string $providerPriceId = null,

        #[ArrayType]
        public array $defaultEntitlements = [],

        #[ArrayType]
        public array $includedFeatures = [],

        #[BooleanType]
        public bool $isPublic = true,

        #[BooleanType]
        public bool $isDeprecated = false,

        #[IntegerType]
        public int $sortOrder = 0,
    ) {
    }
}
