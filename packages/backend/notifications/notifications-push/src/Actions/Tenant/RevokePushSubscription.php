<?php

declare(strict_types=1);

namespace Academorix\Notifications\Push\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Notifications\Push\Contracts\Repositories\PushSubscriptionRepositoryInterface;
use Academorix\Notifications\Push\Enums\NotificationsPushPermission;
use Academorix\Notifications\Push\Models\PushSubscription;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Delete;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Illuminate\Http\Response;

/**
 * `DELETE /api/v1/tenant/notification-subscriptions/{subscription}` — revoke a
 * push subscription.
 *
 * Owners revoke their own; tenant admins revoke any in their tenant. The
 * observer's `deleted` hook fires
 * {@see \Academorix\Notifications\Push\Events\PushSubscriptionRevoked}.
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
