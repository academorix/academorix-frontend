<?php

declare(strict_types=1);

namespace Stackra\FinanceExpensesSdk\Payloads\PayrollRuns;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/payroll-runs` (or the
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
final class CreatePayrollRunPayload extends Data
{
    /**
     * @param  string                       $tenantId
     * @param  string                       $periodStart
     * @param  string                       $periodEnd
     * @param  string                       $status
     * @param  int                          $totalAmountMinor
     * @param  string                       $currency
     * @param  int                          $lineCount
     * @param  ?string                      $computedAt
     * @param  ?string                      $approvedAt
     * @param  ?string                      $approvedByUserId
     * @param  ?string                      $paidAt
     * @param  ?string                      $notes
     * @param  ?array                       $metadata
     */
    public function __construct(
        #[StringType]
        public string $tenantId,

        #[StringType]
        public string $periodStart,

        #[StringType]
        public string $periodEnd,

        #[StringType]
        public string $status,

        public int $totalAmountMinor,

        #[StringType]
        public string $currency,

        public int $lineCount,

        #[StringType]
        public ?string $computedAt = null,

        #[StringType]
        public ?string $approvedAt = null,

        #[StringType]
        public ?string $approvedByUserId = null,

        #[StringType]
        public ?string $paidAt = null,

        #[StringType]
        public ?string $notes = null,

        public ?array $metadata = null,
    ) {
    }
}
