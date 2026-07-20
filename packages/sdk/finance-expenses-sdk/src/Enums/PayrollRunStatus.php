<?php

declare(strict_types=1);

namespace Academorix\FinanceExpensesSdk\Enums;

/**
 * Wire-visible backed enum for `payroll-run.status`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category ExpensesSdk
 *
 * @since    0.1.0
 */
enum PayrollRunStatus: string
{
    case Draft = 'draft';
    case Computed = 'computed';
    case Approved = 'approved';
    case Paid = 'paid';
    case Cancelled = 'cancelled';
}
