<?php

declare(strict_types=1);

namespace Stackra\Notifications\Mail\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Notifications\Mail\Contracts\Data\MailSuppressionInterface;
use Stackra\Notifications\Mail\Contracts\Repositories\MailSuppressionRepositoryInterface;
use Stackra\Notifications\Mail\Data\MailSuppressionData;
use Stackra\Notifications\Mail\Data\Requests\ListMailSuppressionsRequestData;
use Stackra\Notifications\Mail\Enums\NotificationsMailPermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/tenant/mail-suppressions` — list mail suppression
 * rows visible to the caller's tenant.
 *
 * Every row visible to the caller comes back — tenant-scoped rows
 * for their tenant + every platform-wide row (`tenant_id NULL`).
 * The optional filters on
 * {@see ListMailSuppressionsRequestData} narrow further.
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[AsAction(name: 'notifications.mail.suppressions.list')]
#[Get('/api/v1/tenant/mail-suppressions')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(NotificationsMailPermission::SuppressionsViewAny)]
final class ListMailSuppressions
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
     * List the suppressions.
     *
     * @return DataCollection<int, MailSuppressionData>
     */
    public function __invoke(ListMailSuppressionsRequestData $filters): DataCollection
    {
        $query = $this->suppressions->query();

        if ($filters->reason !== null) {
            $query->where(MailSuppressionInterface::ATTR_REASON, $filters->reason);
        }

        if ($filters->provider !== null) {
            $query->where(MailSuppressionInterface::ATTR_PROVIDER, $filters->provider);
        }

        if ($filters->emailDomain !== null) {
            $query->where(MailSuppressionInterface::ATTR_EMAIL_DOMAIN, \strtolower($filters->emailDomain));
        }

        if ($filters->isSystem !== null) {
            $query->where(MailSuppressionInterface::ATTR_IS_SYSTEM, $filters->isSystem);
        }

        $rows = $query
            ->orderByDesc(MailSuppressionInterface::ATTR_CREATED_AT)
            ->limit(100)
            ->get()
            ->map(static fn ($row) => MailSuppressionData::fromModel($row));

        return new DataCollection(MailSuppressionData::class, $rows);
    }
}
