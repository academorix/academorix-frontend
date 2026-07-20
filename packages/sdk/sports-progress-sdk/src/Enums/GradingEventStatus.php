<?php

declare(strict_types=1);

namespace Academorix\SportsProgressSdk\Enums;

/**
 * Wire-visible backed enum for `grading-event.status`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category ProgressSdk
 *
 * @since    0.1.0
 */
enum GradingEventStatus: string
{
    case Scheduled = 'scheduled';
    case InProgress = 'in_progress';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
}
