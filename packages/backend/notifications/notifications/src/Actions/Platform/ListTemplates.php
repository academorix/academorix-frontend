<?php

declare(strict_types=1);

namespace Stackra\Notifications\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Notifications\Contracts\Repositories\NotificationTemplateRepositoryInterface;
use Stackra\Notifications\Data\NotificationTemplateData;
use Stackra\Notifications\Enums\NotificationsPermission;
use Stackra\Notifications\Models\NotificationTemplate;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
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
