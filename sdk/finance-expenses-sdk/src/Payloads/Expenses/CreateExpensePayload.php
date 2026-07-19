<?php

declare(strict_types=1);

namespace Academorix\FinanceExpensesSdk\Payloads\Expenses;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/expenses` (or the
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
final class CreateExpensePayload extends Data
{
    /**
     * @param  string                       $tenantId
     * @param  string                       $regionId
     * @param  string                       $expenseCategoryId
     * @param  string                       $description
     * @param  int                          $amountMinor                Amount in minor units (cents).
     * @param  string                       $currency                   ISO 4217.
     * @param  bool                         $isRecurring
     * @param  string                       $expenseDate
     * @param  string                       $status
     * @param  ?string                      $branchId
     * @param  ?string                      $costCenterId
     * @param  ?string                      $vendor
     * @param  ?string                      $recurrence                 monthly / quarterly / yearly / weekly.
     * @param  ?string                      $recurringParentId
     * @param  ?string                      $dueDate
     * @param  ?string                      $receiptDocumentId
     * @param  ?string                      $approvedAt
     * @param  ?string                      $approvedByUserId
     * @param  ?string                      $paidAt
     * @param  ?string                      $paidByUserId
     * @param  ?string                      $notes
     * @param  ?array                       $metadata
     */
    public function __construct(
        #[StringType]
        public string $tenantId,

        #[StringType]
        public string $regionId,

        #[StringType]
        public string $expenseCategoryId,

        #[StringType]
        public string $description,

        public int $amountMinor,

        #[StringType]
        public string $currency,

        public bool $isRecurring,

        #[StringType]
        public string $expenseDate,

        #[StringType]
        public string $status,

        #[StringType]
        public ?string $branchId = null,

        #[StringType]
        public ?string $costCenterId = null,

        #[StringType]
        public ?string $vendor = null,

        #[StringType]
        public ?string $recurrence = null,

        #[StringType]
        public ?string $recurringParentId = null,

        #[StringType]
        public ?string $dueDate = null,

        #[StringType]
        public ?string $receiptDocumentId = null,

        #[StringType]
        public ?string $approvedAt = null,

        #[StringType]
        public ?string $approvedByUserId = null,

        #[StringType]
        public ?string $paidAt = null,

        #[StringType]
        public ?string $paidByUserId = null,

        #[StringType]
        public ?string $notes = null,

        public ?array $metadata = null,
    ) {
    }
}
