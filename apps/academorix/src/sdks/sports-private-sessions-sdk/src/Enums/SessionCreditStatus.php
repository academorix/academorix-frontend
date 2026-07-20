<?php

declare(strict_types=1);

namespace Academorix\SportsPrivateSessionsSdk\Enums;

/**
 * Wire-visible backed enum for `session-credit.status`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category PrivateSessionsSdk
 *
 * @since    0.1.0
 */
enum SessionCreditStatus: string
{
    case Active = 'active';
    case Exhausted = 'exhausted';
    case Expired = 'expired';
    case Refunded = 'refunded';
}
