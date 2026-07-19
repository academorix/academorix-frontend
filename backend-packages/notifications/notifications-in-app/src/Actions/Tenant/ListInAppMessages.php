<?php

declare(strict_types=1);

namespace Academorix\Notifications\InApp\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Notifications\Enums\NotificationsPermission;
use Academorix\Notifications\InApp\Contracts\Repositories\InAppMessageReadRepositoryInterface;
use Academorix\Notifications\InApp\Contracts\Repositories\InAppMessageRepositoryInterface;
use Academorix\Notifications\InApp\Data\InAppMessageData;
use Academorix\Notifications\InApp\Data\Requests\ListInAppMessagesRequestData;
use Academorix\Notifications\InApp\Models\InAppMessage;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;
use Illuminate\Container\Attributes\Authenticated;
use Illuminate\Contracts\Auth\Authenticatable;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/notifications/in-app` — list the caller's in-app
 * inbox.
 *
 * Bound to the base `notifications.viewOwn` permission per blueprint
 * `permissions.json` §reused_from_parent — the in-app transport
 * reuses the base inbox permissions.
 *
 * `BelongsToTenant` scopes the query to the active tenant
 * automatically; the addressee id narrows to the caller's own rows.
 *
 * @category NotificationsInApp
 *
 * @since    0.1.0
 */
#[AsAction(name: 'notifications.in-app.list')]
#[Get('/api/v1/notifications/in-app')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(NotificationsPermission::ViewAny)]
final class ListInAppMessages
{
    use AsController;

    /**
     * @param  InAppMessageRepositoryInterface      $messages       Message repository.
     * @param  InAppMessageReadRepositoryInterface  $reads          Read-state repository.
     * @param  TenantContextInterface               $tenantContext  Resolved tenant.
     * @param  Authenticatable                      $user           Current tenant user (auto-injected).
     */
    public function __construct(
        private readonly InAppMessageRepositoryInterface $messages,
        private readonly InAppMessageReadRepositoryInterface $reads,
        private readonly TenantContextInterface $tenantContext,
        #[Authenticated] private readonly Authenticatable $user,
    ) {
    }

    /**
     * List the caller's inbox rows, hydrated with their per-row
     * read-state.
     *
     * @return DataCollection<int, InAppMessageData>
     */
    public function __invoke(ListInAppMessagesRequestData $filters): DataCollection
    {
        $tenant      = $this->tenantContext->currentOrFail();
        $tenantId    = (string) $tenant->getKey();
        $addresseeId = (string) $this->user->getAuthIdentifier();

        $rows = $this->messages
            ->findForAddressee($tenantId, $addresseeId, 50)
            ->map(function (InAppMessage $message) use ($addresseeId): InAppMessageData {
                // Per-row read state — bind so the DTO carries the
                // caller's own `is_read` / `is_dismissed` without a
                // second HTTP round-trip.
                $read = $this->reads->findForMessage((string) $message->getKey(), $addresseeId);

                return InAppMessageData::fromModelForAddressee($message, $read);
            });

        return new DataCollection(InAppMessageData::class, $rows);
    }
}
