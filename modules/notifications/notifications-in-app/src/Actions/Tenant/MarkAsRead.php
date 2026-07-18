<?php

declare(strict_types=1);

namespace Academorix\Notifications\InApp\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Notifications\Enums\NotificationsPermission;
use Academorix\Notifications\InApp\Contracts\Data\InAppMessageReadInterface;
use Academorix\Notifications\InApp\Contracts\Repositories\InAppMessageReadRepositoryInterface;
use Academorix\Notifications\InApp\Data\InAppMessageData;
use Academorix\Notifications\InApp\Data\Requests\MarkAsReadRequestData;
use Academorix\Notifications\InApp\Events\InAppMessageRead;
use Academorix\Notifications\InApp\Models\InAppMessage;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;
use Illuminate\Container\Attributes\Authenticated;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * `POST /api/v1/notifications/in-app/{message}/mark-read` — mark the
 * caller's row as read.
 *
 * Idempotent — a second call is a no-op that still returns 200 with
 * the persisted DTO. First-view timestamp is preserved (the audit
 * trail records the earliest read, not the latest).
 *
 * @category NotificationsInApp
 *
 * @since    0.1.0
 */
#[AsAction(name: 'notifications.in-app.mark-read')]
#[Post('/api/v1/notifications/in-app/{message}/mark-read')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[WhereUlid('message')]
#[RequirePermission(NotificationsPermission::MarkSeen)]
final class MarkAsRead
{
    use AsController;

    /**
     * @param  InAppMessageReadRepositoryInterface  $reads          Read-state repository.
     * @param  TenantContextInterface               $tenantContext  Resolved tenant.
     * @param  Authenticatable                      $user           Current tenant user.
     */
    public function __construct(
        private readonly InAppMessageReadRepositoryInterface $reads,
        private readonly TenantContextInterface $tenantContext,
        #[Authenticated] private readonly Authenticatable $user,
    ) {
    }

    /**
     * Mark the message as read + emit the read event (fires only on
     * the first read — the repository's upsert preserves the earliest
     * `read_at` so a second call produces the same row and the event
     * detection here compares `wasRecentlyCreated`).
     *
     * @param  MarkAsReadRequestData  $body     Empty payload.
     * @param  InAppMessage           $message  Route-model-bound message.
     */
    public function __invoke(MarkAsReadRequestData $body, InAppMessage $message): InAppMessageData
    {
        $tenant      = $this->tenantContext->currentOrFail();
        $tenantId    = (string) $tenant->getKey();
        $addresseeId = (string) $this->user->getAuthIdentifier();

        $before        = $this->reads->findForMessage((string) $message->getKey(), $addresseeId);
        $wasReadBefore = ($before?->{InAppMessageReadInterface::ATTR_READ_AT}) !== null;

        $row = $this->reads->markRead(
            $tenantId,
            (string) $message->getKey(),
            $addresseeId,
            'user',
        );

        $rowReadAt = $row->{InAppMessageReadInterface::ATTR_READ_AT};

        // Fire the read event only on the first transition — an
        // already-read row's second mark-read is a no-op observable.
        if (! $wasReadBefore && $rowReadAt instanceof \DateTimeInterface) {
            InAppMessageRead::dispatch(
                (string) $message->getKey(),
                $tenantId,
                $addresseeId,
                $rowReadAt,
            );
        }

        return InAppMessageData::fromModelForAddressee($message, $row);
    }
}
