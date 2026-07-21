<?php

declare(strict_types=1);

namespace Stackra\Notifications\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Notifications\Contracts\Data\NotificationInterface;
use Stackra\Notifications\Enums\NotificationsPermission;
use Stackra\Notifications\Models\Notification;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;
use Illuminate\Contracts\Auth\Factory as AuthFactory;
use Illuminate\Http\JsonResponse;

/**
 * `POST /api/v1/tenant/notifications/mark-all-seen` — mark the whole
 * inbox as seen.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsAction(name: 'notifications.tenant.mark-all-seen')]
#[Post('/api/v1/tenant/notifications/mark-all-seen')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user', 'throttle.mark-seen'])]
#[RequirePermission(NotificationsPermission::MarkSeen)]
final class MarkAllSeen
{
    use AsController;

    public function __construct(
        private readonly TenantContextInterface $tenantContext,
        private readonly AuthFactory $authFactory,
    ) {
    }

    public function __invoke(): JsonResponse
    {
        $tenant = $this->tenantContext->currentOrFail();
        $userId = (string) $this->authFactory->guard('sanctum')->id();

        $affected = Notification::query()
            ->where(NotificationInterface::ATTR_TENANT_ID, (string) $tenant->getKey())
            ->where(NotificationInterface::ATTR_ADDRESSEE_ID, $userId)
            ->whereNull(NotificationInterface::ATTR_SEEN_AT)
            ->update([NotificationInterface::ATTR_SEEN_AT => \now()]);

        return response()->json(['marked_seen' => (int) $affected]);
    }
}
