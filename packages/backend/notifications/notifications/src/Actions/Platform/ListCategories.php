<?php

declare(strict_types=1);

namespace Stackra\Notifications\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Notifications\Contracts\Repositories\NotificationCategoryRepositoryInterface;
use Stackra\Notifications\Data\NotificationCategoryData;
use Stackra\Notifications\Enums\NotificationsPermission;
use Stackra\Notifications\Models\NotificationCategory;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
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
