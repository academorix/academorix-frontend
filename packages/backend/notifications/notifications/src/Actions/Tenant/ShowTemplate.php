<?php

declare(strict_types=1);

namespace Stackra\Notifications\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Notifications\Data\NotificationTemplateData;
use Stackra\Notifications\Enums\NotificationsPermission;
use Stackra\Notifications\Models\NotificationTemplate;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;

/**
 * `GET /api/v1/tenant/notification-templates/{template}` — read one
 * template.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsAction(name: 'notifications.tenant.templates.show')]
#[Get('/api/v1/tenant/notification-templates/{template}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[WhereUlid('template')]
#[RequirePermission(NotificationsPermission::TemplatesView)]
final class ShowTemplate
{
    use AsController;

    public function __invoke(NotificationTemplate $template): NotificationTemplateData
    {
        return NotificationTemplateData::fromModel($template);
    }
}
