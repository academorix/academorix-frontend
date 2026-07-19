<?php

declare(strict_types=1);

namespace Academorix\SportsRegistrationsSdk\Enums;

/**
 * Wire-visible backed enum for `registration-task.status`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category RegistrationsSdk
 *
 * @since    0.1.0
 */
enum RegistrationTaskStatus: string
{
    case Open = 'open';
    case Done = 'done';
    case Cancelled = 'cancelled';
}
