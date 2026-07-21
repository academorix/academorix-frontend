<?php

declare(strict_types=1);

namespace Stackra\Notifications\Actions\Tenant;

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
 * `GET /api/v1/tenant/notification-templates` — list templates for
 * the caller's tenant.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsAction(name: 'notifications.tenant.templates.list')]
#[Get('/api/v1/tenant/notification-templates')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(NotificationsPermission::TemplatesViewAny)]
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
