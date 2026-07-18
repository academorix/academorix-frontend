<?php

declare(strict_types=1);

namespace Academorix\Notifications\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Notifications\Contracts\Repositories\NotificationPreferenceRepositoryInterface;
use Academorix\Notifications\Data\NotificationPreferenceData;
use Academorix\Notifications\Enums\NotificationsPermission;
use Academorix\Notifications\Models\NotificationPreference;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;
use Illuminate\Contracts\Auth\Factory as AuthFactory;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/tenant/notification-preferences` — the caller's
 * preference grid.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsAction(name: 'notifications.tenant.preferences.list')]
#[Get('/api/v1/tenant/notification-preferences')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user', 'throttle.preferences'])]
#[RequirePermission(NotificationsPermission::PreferencesView)]
final class ListPreferences
{
    use AsController;

    public function __construct(
        private readonly NotificationPreferenceRepositoryInterface $preferences,
        private readonly TenantContextInterface $tenantContext,
        private readonly AuthFactory $authFactory,
    ) {
    }

    /**
     * @return DataCollection<int, NotificationPreferenceData>
     */
    public function __invoke(): DataCollection
    {
        $tenant = $this->tenantContext->currentOrFail();
        $userId = (string) $this->authFactory->guard('sanctum')->id();

        $rows = $this->preferences
            ->findByUser((string) $tenant->getKey(), $userId)
            ->map(static fn (NotificationPreference $p): NotificationPreferenceData => NotificationPreferenceData::fromModel($p));

        return new DataCollection(NotificationPreferenceData::class, $rows);
    }
}
