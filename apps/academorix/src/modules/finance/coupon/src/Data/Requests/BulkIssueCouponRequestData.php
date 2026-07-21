<?php

declare(strict_types=1);

namespace Stackra\Coupon\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Between;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated request payload for `POST /api/v1/coupons/bulk-issue`.
 *
 * Every generated coupon shares the `template` config; the code is
 * generated fresh per row via `CodeGenerator`.
 *
 * @category Coupon
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class BulkIssueCouponRequestData extends Data
{
    /**
     * @param  int                  $count         How many codes to generate (1..1000).
     * @param  array<string,mixed>  $template      Shared coupon config (discount_type, discount_amount, ...).
     * @param  string|null          $codePrefix    Optional prefix (`SUMMER2026-`).
     * @param  int                  $codeLength    Random portion length; default 10.
     * @param  string|null          $campaignName  Marketing-campaign label.
     */
    public function __construct(
        #[Required, Between(1, 1000)]
        public int $count,

        #[Required]
        public array $template,

        #[StringType, Max(64)]
        public ?string $codePrefix = null,

        public int $codeLength = 10,

        #[StringType, Max(128)]
        public ?string $campaignName = null,
    ) {
    }
}
