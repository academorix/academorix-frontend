<?php

declare(strict_types=1);

namespace Stackra\Notifications\Services;

use Stackra\Notifications\Contracts\Data\NotificationInterface;
use Stackra\Notifications\Contracts\Repositories\NotificationRepositoryInterface;
use Stackra\Notifications\Contracts\Services\DispatchGatewayInterface;
use Stackra\Notifications\Enums\NotificationStatus;
use Stackra\Notifications\Models\Notification;
use Stackra\Notifications\Support\NotificationDispatchRequest;
use Illuminate\Container\Attributes\Scoped;

/**
 * Default implementation of {@see DispatchGatewayInterface}.
 *
 * Persists the `Notification` row, then defers to the queue via
 * `SendNotificationJob` (which fans out to channel modules). The
 * observer emits `NotificationDispatched` after the row commits so
 * subscribers always see a queryable row.
 *
 * `#[Scoped]` — one instance per request under Octane; the gateway
 * holds no cross-request state but the dependency graph (repo +
 * resolver) is per-request.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Scoped]
final class DefaultDispatchGateway implements DispatchGatewayInterface
{
    /**
     * @param  NotificationRepositoryInterface  $notifications  Persistence boundary.
     */
    public function __construct(
        private readonly NotificationRepositoryInterface $notifications,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function dispatch(NotificationDispatchRequest $request): ?Notification
    {
        // Master kill-switch — when dispatch is off, short-circuit so
        // no row is persisted and no channel module fires.
        if (! (bool) \config('notifications.enabled', true)) {
            return null;
        }

        /** @var Notification $notification */
        $notification = $this->notifications->create([
            NotificationInterface::ATTR_TENANT_ID             => $request->tenantId,
            NotificationInterface::ATTR_APPLICATION_ID        => $request->applicationId,
            NotificationInterface::ATTR_CATEGORY_SLUG         => $request->categorySlug,
            NotificationInterface::ATTR_TEMPLATE_KEY          => $request->templateKey,
            NotificationInterface::ATTR_PRIORITY              => $request->priority,
            NotificationInterface::ATTR_STATE                 => NotificationStatus::Queued->value,
            NotificationInterface::ATTR_ADDRESSEE_TYPE        => $request->addresseeType,
            NotificationInterface::ATTR_ADDRESSEE_ID          => $request->addresseeId,
            NotificationInterface::ATTR_ADDRESSEE_EMAIL       => $request->addresseeEmail,
            NotificationInterface::ATTR_ADDRESSEE_PHONE       => $request->addresseePhone,
            NotificationInterface::ATTR_ADDRESSEE_NAME        => $request->addresseeName,
            NotificationInterface::ATTR_ADDRESSEE_LOCALE      => $request->addresseeLocale,
            NotificationInterface::ATTR_ADDRESSEE_TIMEZONE    => $request->addresseeTimezone,
            NotificationInterface::ATTR_ACTOR_TYPE            => $request->actorType,
            NotificationInterface::ATTR_ACTOR_ID              => $request->actorId,
            NotificationInterface::ATTR_PAYLOAD               => $request->variables,
            NotificationInterface::ATTR_PRIORITY_CHANNELS     => $request->channelsRequested,
            NotificationInterface::ATTR_METADATA              => $request->metadata,
        ]);

        return $notification;
    }
}
