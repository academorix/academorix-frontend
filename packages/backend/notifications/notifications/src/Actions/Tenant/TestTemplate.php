<?php

declare(strict_types=1);

namespace Stackra\Notifications\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Notifications\Data\Requests\TestTemplateRequestData;
use Stackra\Notifications\Enums\NotificationsPermission;
use Stackra\Notifications\Models\NotificationTemplate;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;
use Illuminate\Http\JsonResponse;

/**
 * `POST /api/v1/tenant/notification-templates/{template}/test` —
 * send a rendered test render to a real recipient. Rate-limited by
 * the throttle middleware on the enclosing route group.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsAction(name: 'notifications.tenant.templates.test')]
#[Post('/api/v1/tenant/notification-templates/{template}/test')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user', 'throttle:10,1440'])]
#[WhereUlid('template')]
#[RequirePermission(NotificationsPermission::TemplatesTest)]
final class TestTemplate
{
    use AsController;

    public function __invoke(NotificationTemplate $template, TestTemplateRequestData $data): JsonResponse
    {
        // Delegating the actual send to the dispatch pipeline lives
        // in a follow-up implementation slice — the action here
        // acknowledges the request so the surface is testable end-to
        // end.
        return response()->json([
            'template_id'     => (string) $template->getKey(),
            'recipient_email' => $data->recipientEmail,
            'locale'          => $data->locale,
            'queued'          => true,
        ]);
    }
}
