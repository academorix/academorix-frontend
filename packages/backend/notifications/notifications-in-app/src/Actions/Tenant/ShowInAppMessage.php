<?php

declare(strict_types=1);

namespace Stackra\Notifications\InApp\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Notifications\Enums\NotificationsPermission;
use Stackra\Notifications\InApp\Contracts\Repositories\InAppMessageReadRepositoryInterface;
use Stackra\Notifications\InApp\Data\InAppMessageData;
use Stackra\Notifications\InApp\Models\InAppMessage;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;
use Illuminate\Container\Attributes\Authenticated;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * `GET /api/v1/notifications/in-app/{message}` — read one in-app
 * message scoped to the caller's tenant.
 *
 * `BelongsToTenant` scopes the route-model-bound lookup automatically
 * — a row belonging to a different tenant will 404 rather than 403,
 * mirroring the cross-tenant enumeration-safe behaviour of every
 * other tenant-scoped read.
 *
 * @category NotificationsInApp
 *
 * @since    0.1.0
 */
#[AsAction(name: 'notifications.in-app.show')]
#[Get('/api/v1/notifications/in-app/{message}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[WhereUlid('message')]
#[RequirePermission(NotificationsPermission::View)]
final class ShowInAppMessage
{
    use AsController;

    /**
     * @param  InAppMessageReadRepositoryInterface  $reads  Read-state repository.
     * @param  Authenticatable                      $user   Current tenant user (auto-injected).
     */
    public function __construct(
        private readonly InAppMessageReadRepositoryInterface $reads,
        #[Authenticated] private readonly Authenticatable $user,
    ) {
    }

    /**
     * The route-model-bound `InAppMessage` — already tenant-scoped
     * via `BelongsToTenant`'s global scope.
     */
    public function __invoke(InAppMessage $message): InAppMessageData
    {
        $addresseeId = (string) $this->user->getAuthIdentifier();

        $read = $this->reads->findForMessage((string) $message->getKey(), $addresseeId);

        return InAppMessageData::fromModelForAddressee($message, $read);
    }
}
