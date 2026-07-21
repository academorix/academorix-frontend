<?php

declare(strict_types=1);

namespace Stackra\Notifications\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Notifications\Contracts\Data\NotificationTemplateInterface;
use Stackra\Notifications\Data\NotificationTemplateData;
use Stackra\Notifications\Enums\NotificationsPermission;
use Stackra\Notifications\Enums\TemplateState;
use Stackra\Notifications\Models\NotificationTemplate;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;

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
