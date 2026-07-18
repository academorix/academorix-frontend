<?php

declare(strict_types=1);

namespace Academorix\Notifications\Mail\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Notifications\Mail\Contracts\Repositories\MailSuppressionRepositoryInterface;
use Academorix\Notifications\Mail\Enums\NotificationsMailPermission;
use Academorix\Notifications\Mail\Models\MailSuppression;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Delete;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;
use Illuminate\Http\Response;

/**
 * `DELETE /api/v1/tenant/mail-suppressions/{suppression}` — revoke
 * a suppression.
 *
 * The policy refuses `is_system=true`, `hard_bounce`, `complaint`,
 * and `spam_trap` rows outright. `manual` and `soft_bounce` rows
 * delete cleanly. The `MailSuppressionRevoked` event fires from the
 * observer's `deleted` hook.
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[AsAction(name: 'notifications.mail.suppressions.delete')]
#[Delete('/api/v1/tenant/mail-suppressions/{suppression}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[WhereUlid('suppression')]
#[RequirePermission(NotificationsMailPermission::SuppressionsDelete)]
final class RemoveMailSuppression
{
    use AsController;

    /**
     * @param  MailSuppressionRepositoryInterface  $suppressions  Suppression repository.
     */
    public function __construct(
        private readonly MailSuppressionRepositoryInterface $suppressions,
    ) {
    }

    /**
     * Revoke the suppression. Returns HTTP 204 on success.
     *
     * @param  MailSuppression  $suppression  Route-model-bound row.
     */
    public function __invoke(MailSuppression $suppression): Response
    {
        $this->suppressions->delete((string) $suppression->getKey());

        return response()->noContent();
    }
}
