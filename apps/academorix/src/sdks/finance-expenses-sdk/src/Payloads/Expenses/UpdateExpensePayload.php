<?php

declare(strict_types=1);

namespace Stackra\FinanceExpensesSdk\Payloads\Expenses;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;
use Spatie\LaravelData\Optional;

/**
 * Wire-visible write payload for `PATCH /api/v1/expenses/{id}` (or the
 * tenant-scoped equivalent).
 *
 * Partial-update semantics — every property is typed
 * `T|Optional|null` with an `Optional` sentinel default. Spatie
 * Data's `toArray()` strips `Optional` values, so unmentioned fields
 * are never emitted (never clear server-side state). Pass `null`
 * explicitly to clear a nullable column.
 *
 * @category ExpensesSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class UpdateExpensePayload extends Data
{
    /**
     * @param  Optional|string                  $tenantId
     * @param  Optional|string|null             $branchId
     * @param  Optional|string                  $regionId
     * @param  Optional|string                  $expenseCategoryId
     * @param  Optional|string|null             $costCenterId
     * @param  Optional|string                  $description
     * @param  Optional|int                     $amountMinor                Amount in minor units (cents).
     * @param  Optional|string                  $currency                   ISO 4217.
     * @param  Optional|string|null             $vendor
     * @param  Optional|bool                    $isRecurring
     * @param  Optional|string|null             $recurrence                 monthly / quarterly / yearly / weekly.
     * @param  Optional|string|null             $recurringParentId
     * @param  Optional|string                  $expenseDate
     * @param  Optional|string|null             $dueDate
     * @param  Optional|string|null             $receiptDocumentId
     * @param  Optional|string                  $status
     * @param  Optional|string|null             $approvedAt
     * @param  Optional|string|null             $approvedByUserId
     * @param  Optional|string|null             $paidAt
     * @param  Optional|string|null             $paidByUserId
     * @param  Optional|string|null             $notes
     * @param  Optional|array|null              $metadata
     */
    public function __construct(
        #[StringType]
        public Optional|string $tenantId = new Optional(),

        #[StringType]
        public Optional|string|null $branchId = new Optional(),

        #[StringType]
        public Optional|string $regionId = new Optional(),

        #[StringType]
        public Optional|string $expenseCategoryId = new Optional(),

        #[StringType]
        public Optional|string|null $costCenterId = new Optional(),

        #[StringType]
        public Optional|string $description = new Optional(),

        public Optional|int $amountMinor = new Optional(),

        #[StringType]
        public Optional|string $currency = new Optional(),

        #[StringType]
        public Optional|string|null $vendor = new Optional(),

        public Optional|bool $isRecurring = new Optional(),

        #[StringType]
        public Optional|string|null $recurrence = new Optional(),

        #[StringType]
        public Optional|string|null $recurringParentId = new Optional(),

        #[StringType]
        public Optional|string $expenseDate = new Optional(),

        #[StringType]
        public Optional|string|null $dueDate = new Optional(),

        #[StringType]
        public Optional|string|null $receiptDocumentId = new Optional(),

        #[StringType]
        public Optional|string $status = new Optional(),

        #[StringType]
        public Optional|string|null $approvedAt = new Optional(),

        #[StringType]
        public Optional|string|null $approvedByUserId = new Optional(),

        #[StringType]
        public Optional|string|null $paidAt = new Optional(),

        #[StringType]
        public Optional|string|null $paidByUserId = new Optional(),

        #[StringType]
        public Optional|string|null $notes = new Optional(),

        public Optional|array|null $metadata = new Optional(),
    ) {
    }
}
