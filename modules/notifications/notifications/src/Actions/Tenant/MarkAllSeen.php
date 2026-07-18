<?php

declare(strict_types=1);

namespace Academorix\Notifications\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Notifications\Contracts\Data\NotificationInterface;
use Academorix\Notifications\Enums\NotificationsPermission;
use Academorix\Notifications\Models\Notification;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;
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
