<?php

declare(strict_types=1);

namespace Stackra\Notifications\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Notifications\Contracts\Data\NotificationTemplateInterface;
use Stackra\Notifications\Data\NotificationTemplateData;
use Stackra\Notifications\Data\Requests\UpdateTemplateRequestData;
use Stackra\Notifications\Enums\NotificationsPermission;
use Stackra\Notifications\Models\NotificationTemplate;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Patch;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;

/**
 * `PATCH /api/v1/tenant/notification-templates/{template}` — update a
 * draft template.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsAction(name: 'notifications.tenant.templates.update')]
#[Patch('/api/v1/tenant/notification-templates/{template}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[WhereUlid('template')]
#[RequirePermission(NotificationsPermission::TemplatesUpdate)]
final class UpdateTemplate
{
    use AsController;

    public function __invoke(NotificationTemplate $template, UpdateTemplateRequestData $data): NotificationTemplateData
    {
        $updates = [];

        if ($data->subjectTemplate !== null) {
            $updates[NotificationTemplateInterface::ATTR_SUBJECT_TEMPLATE] = $data->subjectTemplate;
        }

        if ($data->bodyRenderedHtml !== null) {
            $updates[NotificationTemplateInterface::ATTR_BODY_RENDERED_HTML] = $data->bodyRenderedHtml;
        }

        if ($updates !== []) {
            $template->fill($updates);
            $template->save();
        }

        return NotificationTemplateData::fromModel($template);
    }
}
