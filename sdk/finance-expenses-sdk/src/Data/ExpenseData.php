<?php

declare(strict_types=1);

namespace Academorix\FinanceExpensesSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\Expense}.
 *
 * Mirrors `schemas/expense.schema.json` column-for-column, minus
 * the fields declared under `x-wire.hidden` which never leave the
 * server. Wire format is snake_case; PHP property names are
 * camelCase — the `SnakeCaseMapper` bridges the two.
 *
 * ## What this DTO owns
 *
 * A read-only, immutable projection of the row as the
 * Finance service emits it. Consumers never instantiate
 * this DTO by hand — the SDK's request classes hydrate it from the
 * response envelope inside `createDtoFromResponse()`.
 *
 * ## Example
 *
 * ```php
 * use Academorix\FinanceSdk\Client\FinanceSdk;
 *
 * $row = app(FinanceSdk::class)->expenses()->expenses()->show($id);
 * ```
 *
 * @category ExpensesSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class ExpenseData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $regionId
     * @param  string                       $expenseCategoryId
     * @param  string                       $description
     * @param  int                          $amountMinor                Amount in minor units (cents).
     * @param  string                       $currency                   ISO 4217.
     * @param  bool                         $isRecurring
     * @param  string                       $expenseDate
     * @param  string                       $status
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
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
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $regionId,
        public string $expenseCategoryId,
        public string $description,
        public int $amountMinor,
        public string $currency,
        public bool $isRecurring,
        public string $expenseDate,
        public string $status,
        public string $createdAt,
        public string $updatedAt,
        public ?string $branchId = null,
        public ?string $costCenterId = null,
        public ?string $vendor = null,
        public ?string $recurrence = null,
        public ?string $recurringParentId = null,
        public ?string $dueDate = null,
        public ?string $receiptDocumentId = null,
        public ?string $approvedAt = null,
        public ?string $approvedByUserId = null,
        public ?string $paidAt = null,
        public ?string $paidByUserId = null,
        public ?string $notes = null,
        public ?array $metadata = null,
        public ?string $deletedAt = null,
    ) {
    }

    /**
     * Hydrate from a raw wire record (already unwrapped from the
     * `{ "data": ... }` envelope).
     *
     * @param  array<string, mixed>  $row  The raw snake_case record.
     * @return self                        The hydrated DTO.
     */
    public static function fromRecord(array $row): self
    {
        // Delegate to Spatie Data's canonical hydration path so
        // `#[MapInputName]` fires and every property is normalised
        // through the same mapper the response-side uses.
        return self::from($row);
    }
}
