<?php

declare(strict_types=1);

namespace Academorix\FinanceExpensesSdk\Enums;

/**
 * Wire-visible backed enum for `expense.status`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category ExpensesSdk
 *
 * @since    0.1.0
 */
enum ExpenseStatus: string
{
    case Draft = 'draft';
    case Approved = 'approved';
    case Paid = 'paid';
    case Cancelled = 'cancelled';
}
