<?php

declare(strict_types=1);

namespace Academorix\Notifications\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Notifications\Contracts\Data\NotificationTemplateInterface;
use Academorix\Notifications\Data\NotificationTemplateData;
use Academorix\Notifications\Data\Requests\UpdateTemplateRequestData;
use Academorix\Notifications\Enums\NotificationsPermission;
use Academorix\Notifications\Models\NotificationTemplate;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Patch;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;

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
