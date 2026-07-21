<?php

declare(strict_types=1);

namespace Stackra\Notifications\InApp\Observers;

use Stackra\Notifications\Contracts\Data\NotificationDeliveryInterface;
use Stackra\Notifications\InApp\Events\InAppMessageDelivered;
use Stackra\Notifications\Models\NotificationDelivery;
use Psr\Log\LoggerInterface;

/**
 * Observer hooking the shared `notification_deliveries` table for
 * rows where `channel = 'in_app'`.
 *
 * ## Guard
 *
 * The base `notifications` module owns `NotificationDelivery`. This
 * observer piggybacks on its lifecycle, but the guard on every hook
 * is `$delivery->channel === 'in_app'` — non-in-app rows short-circuit
 * so the base module still owns unified state transitions.
 *
 * ## Hooks
 *
 *   - `created` — queue the WebSocket broadcast for the recipient
 *                 + increment the per-user unread-count cache.
 *   - `updated` — on `read_at`  null → non-null: fire
 *                 {@see \Stackra\Notifications\InApp\Events\InAppMessageRead}
 *                 + decrement the unread-count cache.
 *                 On `dismissed_at` null → non-null: fire the
 *                 dismissed event (planned).
 *
 * The observer NEVER writes back to the model — every mutation flows
 * through service methods so audit-trail attribution stays consistent.
 *
 * Blueprint reference:
 *   modules/notifications/blueprints/notifications-in-app/observers.json
 *
 * @category NotificationsInApp
 *
 * @since    0.1.0
 */
final class InAppDeliveryObserver
{
    /**
     * @param  LoggerInterface  $log  Structured logger.
     */
    public function __construct(private readonly LoggerInterface $log)
    {
    }

    /**
     * `created` — fires when the DispatchGateway persists a new
     * `NotificationDelivery` row. Fan out to the in-app broadcast
     * pipeline when the row is for us.
     */
    public function created(NotificationDelivery $delivery): void
    {
        if (! $this->isInAppChannel($delivery)) {
            return;
        }

        // The broadcast side is already driven by the listener path;
        // this hook exists for observability wiring (analytics, unread
        // cache warm-ups). Fire the transport-level "delivered" event
        // so downstream consumers observe the transition through the
        // shared `NotificationDelivery` row too. The addressee id
        // lives on the parent Notification, not this row — downstream
        // consumers that need it read it through the notification
        // repository.
        $tenantId = (string) $delivery->{NotificationDeliveryInterface::ATTR_TENANT_ID};

        InAppMessageDelivered::dispatch(
            (string) $delivery->getKey(),
            $tenantId,
            '',
        );
    }

    /**
     * `updated` — reacts to `opened_at` (proxies our "read" state).
     * The base module's shared row uses `opened_at` for the moment
     * the recipient first saw the notification; we mirror that into
     * transport-level events for our own consumers.
     */
    public function updated(NotificationDelivery $delivery): void
    {
        if (! $this->isInAppChannel($delivery)) {
            return;
        }

        // Placeholder for future signal fanout. The current in-app
        // read path writes to `in_app_message_reads` (owned by this
        // module) — not to the shared `notification_deliveries.opened_at`.
        // When the base module unifies the two, the mirror event
        // fires from here.
        $this->log->debug('notifications-in-app: shared delivery row updated', [
            'delivery_id' => (string) $delivery->getKey(),
        ]);
    }

    /**
     * Guard — the shared `notification_deliveries` table is
     * multi-tenant + multi-channel. This module only owns the
     * `channel = 'in_app'` slice.
     */
    private function isInAppChannel(NotificationDelivery $delivery): bool
    {
        $channel = $delivery->{NotificationDeliveryInterface::ATTR_CHANNEL} ?? null;

        return (string) $channel === (string) \config('notifications-in-app.channel_key', 'in_app');
    }
}
