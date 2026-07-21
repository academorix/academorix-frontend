<?php

declare(strict_types=1);

namespace Stackra\FinanceExpensesSdk\Enums;

/**
 * Wire-visible backed enum for `expense.recurrence`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category ExpensesSdk
 *
 * @since    0.1.0
 */
enum ExpenseRecurrence: string
{
    case Monthly = 'monthly';
    case Quarterly = 'quarterly';
    case Yearly = 'yearly';
    case Weekly = 'weekly';
}
