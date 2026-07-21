<?php

declare(strict_types=1);

namespace Stackra\Subscription\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\ArrayType;
use Spatie\LaravelData\Attributes\Validation\BooleanType;
use Spatie\LaravelData\Attributes\Validation\IntegerType;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for `PATCH /api/v1/platform/plans/{plan}`.
 *
 * Every field is optional — the action patches only the columns
 * present in the request.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class UpdatePlanRequestData extends Data
{
    /**
     * @param  array<string, mixed>|null  $defaultEntitlements
     * @param  list<string>|null          $includedFeatures
     */
    public function __construct(
        #[StringType, Max(200)]
        public ?string $name = null,

        #[StringType]
        public ?string $description = null,

        #[IntegerType, Min(0)]
        public ?int $priceMicroUnits = null,

        #[StringType, Max(3)]
        public ?string $currency = null,

        #[IntegerType, Min(0), Max(90)]
        public ?int $trialDays = null,

        #[StringType, Max(128)]
        public ?string $providerPriceId = null,

        #[ArrayType]
        public ?array $defaultEntitlements = null,

        #[ArrayType]
        public ?array $includedFeatures = null,

        #[BooleanType]
        public ?bool $isPublic = null,

        #[BooleanType]
        public ?bool $isDeprecated = null,

        #[IntegerType]
        public ?int $sortOrder = null,
    ) {
    }
}
