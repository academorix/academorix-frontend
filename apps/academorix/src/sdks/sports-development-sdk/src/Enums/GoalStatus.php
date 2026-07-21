<?php

declare(strict_types=1);

namespace Stackra\SportsDevelopmentSdk\Enums;

/**
 * Wire-visible backed enum for `goal.status`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category DevelopmentSdk
 *
 * @since    0.1.0
 */
enum GoalStatus: string
{
    case Open = 'open';
    case Achieved = 'achieved';
    case Deferred = 'deferred';
    case Dropped = 'dropped';
}
