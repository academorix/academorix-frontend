<?php

declare(strict_types=1);

namespace Stackra\SportsRegistrationsSdk\Enums;

/**
 * Wire-visible backed enum for `registration-task.priority`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category RegistrationsSdk
 *
 * @since    0.1.0
 */
enum RegistrationTaskPriority: string
{
    case Low = 'low';
    case Normal = 'normal';
    case High = 'high';
    case Urgent = 'urgent';
}
