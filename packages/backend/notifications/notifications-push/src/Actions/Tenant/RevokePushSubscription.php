<?php

declare(strict_types=1);

namespace Stackra\Notifications\Push\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Notifications\Push\Contracts\Repositories\PushSubscriptionRepositoryInterface;
use Stackra\Notifications\Push\Enums\NotificationsPushPermission;
use Stackra\Notifications\Push\Models\PushSubscription;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Delete;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Illuminate\Http\Response;

/**
 * `DELETE /api/v1/tenant/notification-subscriptions/{subscription}` — revoke a
 * push subscription.
 *
 * Owners revoke their own; tenant admins revoke any in their tenant. The
 * observer's `deleted` hook fires
 * {@see \Stackra\Notifications\Push\Events\PushSubscriptionRevoked}.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
#[AsAction(name: 'notifications.push.subscriptions.revoke')]
#[Delete('/api/v1/tenant/notification-subscriptions/{subscription}')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve'])]
#[RequirePermission(NotificationsPushPermission::SubscriptionsDelete)]
final class RevokePushSubscription
{
    use AsController;

    public function __construct(
        private readonly PushSubscriptionRepositoryInterface $subscriptions,
    ) {
    }

    public function __invoke(string $subscription): Response
    {
        $model = $this->subscriptions->find($subscription);
        if ($model instanceof PushSubscription) {
            $model->delete();
        }

        return \response()->noContent();
    }
}
