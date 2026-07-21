<?php

declare(strict_types=1);

namespace Stackra\PlatformRealtimeSdk\Enums;

/**
 * Wire-visible backed enum for `broadcast-subscription.status`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category RealtimeSdk
 *
 * @since    0.1.0
 */
enum BroadcastSubscriptionStatus: string
{
    case PendingAuth = 'pending_auth';
    case Active = 'active';
    case Disconnected = 'disconnected';
}
