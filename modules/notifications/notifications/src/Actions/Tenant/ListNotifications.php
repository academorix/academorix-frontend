<?php

declare(strict_types=1);

namespace Academorix\Notifications\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Notifications\Contracts\Repositories\NotificationRepositoryInterface;
use Academorix\Notifications\Data\NotificationData;
use Academorix\Notifications\Enums\NotificationsPermission;
use Academorix\Notifications\Models\Notification;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;
use Illuminate\Contracts\Auth\Factory as AuthFactory;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/tenant/notifications` — the caller's inbox.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsAction(name: 'notifications.tenant.list')]
#[Get('/api/v1/tenant/notifications')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(NotificationsPermission::ViewAny)]
final class ListNotifications
{
    use AsController;

    public function __construct(
        private readonly NotificationRepositoryInterface $notifications,
        private readonly TenantContextInterface $tenantContext,
        private readonly AuthFactory $authFactory,
    ) {
    }

    /**
     * @return DataCollection<int, NotificationData>
     */
    public function __invoke(): DataCollection
    {
        $tenant = $this->tenantContext->currentOrFail();
        $userId = (string) $this->authFactory->guard('sanctum')->id();

        $rows = $this->notifications
            ->paginateInboxFor((string) $tenant->getKey(), $userId)
            ->getCollection()
            ->map(static fn (Notification $n): NotificationData => NotificationData::fromModel($n));

        return new DataCollection(NotificationData::class, $rows);
    }
}
