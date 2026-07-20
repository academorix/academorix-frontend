<?php

declare(strict_types=1);

namespace Academorix\Notifications\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Notifications\Contracts\Repositories\NotificationTemplateRepositoryInterface;
use Academorix\Notifications\Data\NotificationTemplateData;
use Academorix\Notifications\Enums\NotificationsPermission;
use Academorix\Notifications\Models\NotificationTemplate;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/platform/notification-templates` — platform-admin
 * cross-tenant template list.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsAction(name: 'notifications.platform.templates.list')]
#[Get('/api/v1/platform/notification-templates')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(NotificationsPermission::PlatformTemplatesViewAny)]
final class ListTemplates
{
    use AsController;

    public function __construct(
        private readonly NotificationTemplateRepositoryInterface $templates,
    ) {
    }

    /**
     * @return DataCollection<int, NotificationTemplateData>
     */
    public function __invoke(): DataCollection
    {
        $rows = $this->templates
            ->paginate()
            ->getCollection()
            ->map(static fn (NotificationTemplate $t): NotificationTemplateData => NotificationTemplateData::fromModel($t));

        return new DataCollection(NotificationTemplateData::class, $rows);
    }
}
