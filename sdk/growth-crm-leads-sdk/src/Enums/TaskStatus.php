<?php

declare(strict_types=1);

namespace Academorix\GrowthCrmLeadsSdk\Enums;

/**
 * Wire-visible backed enum for `task.status`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category CrmLeadsSdk
 *
 * @since    0.1.0
 */
enum TaskStatus: string
{
    case Open = 'open';
    case InProgress = 'in_progress';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
}
