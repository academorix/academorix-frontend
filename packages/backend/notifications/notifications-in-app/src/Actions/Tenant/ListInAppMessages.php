<?php

declare(strict_types=1);

namespace Stackra\Notifications\InApp\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Notifications\Enums\NotificationsPermission;
use Stackra\Notifications\InApp\Contracts\Repositories\InAppMessageReadRepositoryInterface;
use Stackra\Notifications\InApp\Contracts\Repositories\InAppMessageRepositoryInterface;
use Stackra\Notifications\InApp\Data\InAppMessageData;
use Stackra\Notifications\InApp\Data\Requests\ListInAppMessagesRequestData;
use Stackra\Notifications\InApp\Models\InAppMessage;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;
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
