<?php

declare(strict_types=1);

namespace Stackra\SportsProgressSdk\Enums;

/**
 * Wire-visible backed enum for `grading-result.result`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category ProgressSdk
 *
 * @since    0.1.0
 */
enum GradingResultResult: string
{
    case Pending = 'pending';
    case Pass = 'pass';
    case Fail = 'fail';
    case Deferred = 'deferred';
}
