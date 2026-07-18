<?php

declare(strict_types=1);

namespace Academorix\Notifications\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Notifications\Contracts\Data\NotificationTemplateInterface;
use Academorix\Notifications\Data\NotificationTemplateData;
use Academorix\Notifications\Enums\NotificationsPermission;
use Academorix\Notifications\Enums\TemplateState;
use Academorix\Notifications\Models\NotificationTemplate;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;

/**
 * `POST /api/v1/tenant/notification-templates/{template}/publish` —
 * transition a draft to published.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsAction(name: 'notifications.tenant.templates.publish')]
#[Post('/api/v1/tenant/notification-templates/{template}/publish')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[WhereUlid('template')]
#[RequirePermission(NotificationsPermission::TemplatesPublish)]
final class PublishTemplate
{
    use AsController;

    public function __invoke(NotificationTemplate $template): NotificationTemplateData
    {
        $template->{NotificationTemplateInterface::ATTR_STATE}        = TemplateState::Published->value;
        $template->{NotificationTemplateInterface::ATTR_PUBLISHED_AT} = \now();
        $template->save();

        return NotificationTemplateData::fromModel($template);
    }
}
