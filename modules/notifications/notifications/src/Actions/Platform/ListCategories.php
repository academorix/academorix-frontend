<?php

declare(strict_types=1);

namespace Academorix\Notifications\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Notifications\Contracts\Repositories\NotificationCategoryRepositoryInterface;
use Academorix\Notifications\Data\NotificationCategoryData;
use Academorix\Notifications\Enums\NotificationsPermission;
use Academorix\Notifications\Models\NotificationCategory;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/platform/notification-categories` — platform-admin
 * cross-tenant category registry.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsAction(name: 'notifications.platform.categories.list')]
#[Get('/api/v1/platform/notification-categories')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(NotificationsPermission::PlatformCategoriesViewAny)]
final class ListCategories
{
    use AsController;

    public function __construct(
        private readonly NotificationCategoryRepositoryInterface $categories,
    ) {
    }

    /**
     * @return DataCollection<int, NotificationCategoryData>
     */
    public function __invoke(): DataCollection
    {
        $rows = $this->categories
            ->paginate()
            ->getCollection()
            ->map(static fn (NotificationCategory $c): NotificationCategoryData => NotificationCategoryData::fromModel($c));

        return new DataCollection(NotificationCategoryData::class, $rows);
    }
}
