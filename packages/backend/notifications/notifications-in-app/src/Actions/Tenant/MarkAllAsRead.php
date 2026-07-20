<?php

declare(strict_types=1);

namespace Academorix\Notifications\InApp\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Notifications\Enums\NotificationsPermission;
use Academorix\Notifications\InApp\Contracts\Repositories\InAppMessageReadRepositoryInterface;
use Academorix\Notifications\InApp\Data\Requests\MarkAsReadRequestData;
use Academorix\Notifications\InApp\Events\InAppBulkMarkAllRead;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;
use Illuminate\Container\Attributes\Authenticated;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\JsonResponse;

/**
 * `POST /api/v1/notifications/in-app/mark-all-read` — bulk mark-read
 * for every unread in-app message targeting the caller in the
 * current tenant.
 *
 * The repository runs the write in a transaction; the individual
 * read events are SUPPRESSED (would fan out to N events for N rows —
 * that's noise). One {@see InAppBulkMarkAllRead} event fires on
 * completion carrying the count of rows newly-marked.
 *
 * @category NotificationsInApp
 *
 * @since    0.1.0
 */
#[AsAction(name: 'notifications.in-app.mark-all-read')]
#[Post('/api/v1/notifications/in-app/mark-all-read')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(NotificationsPermission::MarkSeen)]
final class MarkAllAsRead
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
     * Mark every unread row read + emit the bulk event.
     *
     * Returns the count of rows newly-marked in a small envelope —
     * frontends use this to reconcile local unread state without a
     * second `/unread-count` round-trip.
     */
    public function __invoke(MarkAsReadRequestData $body): JsonResponse
    {
        $tenant      = $this->tenantContext->currentOrFail();
        $tenantId    = (string) $tenant->getKey();
        $addresseeId = (string) $this->user->getAuthIdentifier();

        $marked = $this->reads->markAllRead($tenantId, $addresseeId, 'user');

        InAppBulkMarkAllRead::dispatch($tenantId, $addresseeId, $marked);

        return \response()->json([
            'data' => [
                'deliveries_marked' => $marked,
            ],
        ]);
    }
}
