<?php

declare(strict_types=1);

namespace Academorix\FinanceExpensesSdk\Payloads\ExpenseCategories;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/expense-categories` (or the
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
final class CreateExpenseCategoryPayload extends Data
{
    /**
     * @param  string                       $tenantId
     * @param  string                       $code                       rent / utilities / equipment / maintenance / salaries / marketing / insurance / travel / office_supplies / other.
     * @param  string                       $name
     * @param  int                          $sortOrder
     * @param  bool                         $isSystem
     * @param  ?array                       $metadata
     */
    public function __construct(
        #[StringType]
        public string $tenantId,

        #[StringType]
        public string $code,

        #[StringType]
        public string $name,

        public int $sortOrder,

        public bool $isSystem,

        public ?array $metadata = null,
    ) {
    }
}
