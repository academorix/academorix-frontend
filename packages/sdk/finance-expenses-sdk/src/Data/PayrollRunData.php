<?php

declare(strict_types=1);

namespace Academorix\FinanceExpensesSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\PayrollRun}.
 *
 * Mirrors `schemas/payroll-run.schema.json` column-for-column, minus
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
 * $row = app(FinanceSdk::class)->expenses()->payrollRuns()->show($id);
 * ```
 *
 * @category ExpensesSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class PayrollRunData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $periodStart
     * @param  string                       $periodEnd
     * @param  string                       $status
     * @param  int                          $totalAmountMinor
     * @param  string                       $currency
     * @param  int                          $lineCount
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $computedAt
     * @param  ?string                      $approvedAt
     * @param  ?string                      $approvedByUserId
     * @param  ?string                      $paidAt
     * @param  ?string                      $notes
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $periodStart,
        public string $periodEnd,
        public string $status,
        public int $totalAmountMinor,
        public string $currency,
        public int $lineCount,
        public string $createdAt,
        public string $updatedAt,
        public ?string $computedAt = null,
        public ?string $approvedAt = null,
        public ?string $approvedByUserId = null,
        public ?string $paidAt = null,
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
