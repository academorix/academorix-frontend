<?php

declare(strict_types=1);

namespace Academorix\PlatformSafeguardingSdk\Enums;

/**
 * Wire-visible backed enum for `background-check.status`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category SafeguardingSdk
 *
 * @since    0.1.0
 */
enum BackgroundCheckStatus: string
{
    case Pending = 'pending';
    case Verified = 'verified';
    case Expired = 'expired';
    case Revoked = 'revoked';
}
