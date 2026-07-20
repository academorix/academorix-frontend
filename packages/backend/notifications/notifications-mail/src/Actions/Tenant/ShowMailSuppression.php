<?php

declare(strict_types=1);

namespace Academorix\Notifications\Mail\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Notifications\Mail\Data\MailSuppressionData;
use Academorix\Notifications\Mail\Enums\NotificationsMailPermission;
use Academorix\Notifications\Mail\Models\MailSuppression;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;

/**
 * `GET /api/v1/tenant/mail-suppressions/{suppression}` — show a
 * single suppression row.
 *
 * Route-model-binding on `{suppression}` — the row is resolved by
 * primary key; `BelongsToTenantOptional`'s global scope filters out
 * rows the caller can't see (returning HTTP 404 for cross-tenant
 * access rather than 403 to avoid enumeration).
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[AsAction(name: 'notifications.mail.suppressions.show')]
#[Get('/api/v1/tenant/mail-suppressions/{suppression}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[WhereUlid('suppression')]
#[RequirePermission(NotificationsMailPermission::SuppressionsView)]
final class ShowMailSuppression
{
    use AsController;

    /**
     * @param  MailSuppression  $suppression  Route-model-bound row.
     */
    public function __invoke(MailSuppression $suppression): MailSuppressionData
    {
        return MailSuppressionData::fromModel($suppression);
    }
}
