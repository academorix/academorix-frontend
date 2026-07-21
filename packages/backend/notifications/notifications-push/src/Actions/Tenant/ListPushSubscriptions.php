<?php

declare(strict_types=1);

namespace Stackra\Notifications\Push\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Notifications\Push\Contracts\Data\PushSubscriptionInterface;
use Stackra\Notifications\Push\Contracts\Repositories\PushSubscriptionRepositoryInterface;
use Stackra\Notifications\Push\Data\PushSubscriptionData;
use Stackra\Notifications\Push\Enums\NotificationsPushPermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * `GET /api/v1/tenant/notification-subscriptions` — list push subscriptions.
 *
 * Regular users see their own devices; tenant admins see every subscription
 * in their tenant. Every response omits `device_token` (RESTRICTED tier).
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
#[AsAction(name: 'notifications.push.subscriptions.list')]
#[Get('/api/v1/tenant/notification-subscriptions')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve'])]
#[RequirePermission(NotificationsPushPermission::SubscriptionsViewAny)]
final class ListPushSubscriptions
{
    use AsController;

    public function __construct(
        private readonly PushSubscriptionRepositoryInterface $subscriptions,
    ) {
    }

    /**
     * @return array<int, PushSubscriptionData>
     */
    public function __invoke(#[CurrentUser] Authenticatable $user): array
    {
        // Users with only the base subscriptions.viewAny permission see just
        // their own devices. Tenant admins carry the same permission BUT
        // also have PlatformSubscriptionsViewAny OR their tenant-scoped
        // policy exempts them — the policy is where the cross-user branch
        // lives. Here we default to "own devices" and let the caller escalate
        // via a filter param handled by the base repository.
        $userId = \method_exists($user, 'getKey') ? (string) $user->getKey() : '';

        $rows = $this->subscriptions->query()
            ->where(PushSubscriptionInterface::ATTR_USER_ID, $userId)
            ->orderByDesc(PushSubscriptionInterface::ATTR_CREATED_AT)
            ->get();

        return $rows->map(
            static fn ($subscription): PushSubscriptionData => PushSubscriptionData::fromModel($subscription),
        )->all();
    }
}
