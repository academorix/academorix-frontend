<?php

declare(strict_types=1);

namespace Stackra\FinanceExpensesSdk\Payloads\Budgets;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/budgets` (or the
 * tenant-scoped equivalent).
 *
 * Every non-nullable property is auto-required by spatie/laravel-data;
 * every nullable defaults to `null`. Snake_case bridge in both
 * directions — the DTO's `toArray()` emits snake_case for the wire,
 * and Spatie validation kicks in during construction.
 *
 * @category ExpensesSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class CreateBudgetPayload extends Data
{
    /**
     * @param  string                       $tenantId
     * @param  string                       $periodStart
     * @param  string                       $periodEnd
     * @param  int                          $amountMinor
     * @param  int                          $usedAmountMinor
     * @param  string                       $currency
     * @param  ?string                      $branchId
     * @param  ?string                      $expenseCategoryId
     * @param  ?string                      $costCenterId
     * @param  ?int                         $alertThresholdPercent
     * @param  ?array                       $metadata
     */
    public function __construct(
        #[StringType]
        public string $tenantId,

        #[StringType]
        public string $periodStart,

        #[StringType]
        public string $periodEnd,

        public int $amountMinor,

        public int $usedAmountMinor,

        #[StringType]
        public string $currency,

        #[StringType]
        public ?string $branchId = null,

        #[StringType]
        public ?string $expenseCategoryId = null,

        #[StringType]
        public ?string $costCenterId = null,

        public ?int $alertThresholdPercent = null,

        public ?array $metadata = null,
    ) {
    }
}
