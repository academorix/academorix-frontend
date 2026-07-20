<?php

declare(strict_types=1);

namespace Academorix\SportsPrivateSessionsSdk\Enums;

/**
 * Wire-visible backed enum for `session-credit.kind`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category PrivateSessionsSdk
 *
 * @since    0.1.0
 */
enum SessionCreditKind: string
{
    case Single = 'single';
    case Pack5 = 'pack_5';
    case Pack10 = 'pack_10';
    case Pack20 = 'pack_20';
    case UnlimitedPeriod = 'unlimited_period';
}
