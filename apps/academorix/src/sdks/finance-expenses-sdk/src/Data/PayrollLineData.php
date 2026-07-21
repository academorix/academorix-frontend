<?php

declare(strict_types=1);

namespace Stackra\FinanceExpensesSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\PayrollLine}.
 *
 * Mirrors `schemas/payroll-line.schema.json` column-for-column, minus
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
 * use Stackra\FinanceSdk\Client\FinanceSdk;
 *
 * $row = app(FinanceSdk::class)->expenses()->payrollLines()->show($id);
 * ```
 *
 * @category ExpensesSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class PayrollLineData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $payrollRunId
     * @param  string                       $staffId
     * @param  int                          $sessionsDelivered
     * @param  int                          $grossAmountMinor
     * @param  int                          $bonusAmountMinor
     * @param  int                          $deductionsAmountMinor
     * @param  int                          $netAmountMinor
     * @param  string                       $currency
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $hoursWorked
     * @param  array<string, mixed>|null    $branchAllocations          Multi-branch split — [{branch_id, ratio, amount_minor}].
     * @param  ?string                      $computedAt
     * @param  array<string, mixed>|null    $metadata
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $payrollRunId,
        public string $staffId,
        public int $sessionsDelivered,
        public int $grossAmountMinor,
        public int $bonusAmountMinor,
        public int $deductionsAmountMinor,
        public int $netAmountMinor,
        public string $currency,
        public string $createdAt,
        public string $updatedAt,
        public ?string $hoursWorked = null,
        public ?array $branchAllocations = null,
        public ?string $computedAt = null,
        public ?array $metadata = null,
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
