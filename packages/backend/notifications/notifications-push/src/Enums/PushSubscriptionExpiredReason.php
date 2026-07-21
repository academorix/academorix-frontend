<?php

declare(strict_types=1);

namespace Stackra\Notifications\Push\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Reasons a {@see \Stackra\Notifications\Push\Models\PushSubscription} may
 * become expired / inactive.
 *
 * Carried on `PushSubscriptionExpired` events so listeners (analytics, audit,
 * cache invalidation) can branch on the WHY without inspecting the row.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum PushSubscriptionExpiredReason: string
{
    use Enum;

    #[Label('Invalid Token')]
    #[Description('Provider reported the token is no longer valid (uninstalled app, rotated token).')]
    case InvalidToken = 'invalid_token';

    #[Label('Permission Revoked')]
    #[Description('User revoked notification permission at the OS level.')]
    case PermissionRevoked = 'permission_revoked';

    #[Label('Idle Prune')]
    #[Description('Subscription idle beyond retention window.')]
    case IdlePrune = 'idle_prune';

    #[Label('User Revoke')]
    #[Description('User or admin explicitly deleted the subscription.')]
    case UserRevoke = 'user_revoke';
}
