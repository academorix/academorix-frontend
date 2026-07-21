<?php

declare(strict_types=1);

namespace Stackra\Notifications\Mail\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Notifications\Mail\Contracts\Data\MailSuppressionInterface;
use Stackra\Notifications\Mail\Contracts\Repositories\MailSuppressionRepositoryInterface;
use Stackra\Notifications\Mail\Data\MailSuppressionData;
use Stackra\Notifications\Mail\Data\Requests\AddMailSuppressionRequestData;
use Stackra\Notifications\Mail\Enums\NotificationsMailPermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;

/**
 * `POST /api/v1/tenant/mail-suppressions` — manually block an email
 * address for the current tenant.
 *
 * Always creates a tenant-scoped row (`is_system=false`,
 * `tenant_id = active tenant`). Platform-wide creation is a
 * super_admin operation performed via the
 * `notifications:mail:suppression-add --platform-wide` command,
 * NOT this endpoint.
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[AsAction(name: 'notifications.mail.suppressions.create')]
#[Post('/api/v1/tenant/mail-suppressions')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(NotificationsMailPermission::SuppressionsCreate)]
final class AddMailSuppression
{
    use AsController;

    /**
     * @param  MailSuppressionRepositoryInterface  $suppressions   Suppression repository.
     * @param  TenantContextInterface              $tenantContext  Resolved tenant.
     */
    public function __construct(
        private readonly MailSuppressionRepositoryInterface $suppressions,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    /**
     * Create a manual tenant-scoped suppression.
     *
     * The `email_domain` column is computed automatically by the
     * model observer's `saving` hook; the `MailSuppressed` event
     * fires from the `created` hook. This action is a thin write —
     * no orchestration.
     */
    public function __invoke(AddMailSuppressionRequestData $data): MailSuppressionData
    {
        $tenant   = $this->tenantContext->currentOrFail();
        $tenantId = (string) $tenant->getKey();
        $email    = \strtolower(\trim($data->email));

        $row = $this->suppressions->create([
            MailSuppressionInterface::ATTR_TENANT_ID     => $tenantId,
            MailSuppressionInterface::ATTR_EMAIL         => $email,
            MailSuppressionInterface::ATTR_REASON        => $data->reason,
            MailSuppressionInterface::ATTR_BOUNCE_REASON => $data->bounceReason,
            MailSuppressionInterface::ATTR_IS_SYSTEM     => false,
        ]);

        return MailSuppressionData::fromModel($row);
    }
}
