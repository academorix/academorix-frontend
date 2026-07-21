<?php

declare(strict_types=1);

namespace Stackra\Notifications\InApp\Listeners;

use Stackra\Events\Attributes\OnEvent;
use Stackra\Notifications\InApp\Jobs\BroadcastInAppNotificationJob;
use Illuminate\Contracts\Queue\ShouldQueue;
use Psr\Log\LoggerInterface;

/**
 * Subscribes to the parent notifications module's
 * `NotificationDispatched` event and translates it into a queued
 * broadcast job when the resolved channels include `in_app`.
 *
 * ## Blueprint reference
 *
 *   modules/notifications/blueprints/notifications-in-app/listeners.json
 *   →  event   : `notifications::NotificationDispatched`
 *   →  filter  : `event.channels_requested contains 'in_app'`
 *   →  purpose : Dispatch `BroadcastInAppNotificationJob` which
 *                creates the delivery row via core's DispatchGateway
 *                + emits the Reverb broadcast.
 *
 * ## Framework note
 *
 * The parent notifications module's `NotificationDispatched` event
 * class isn't shipped yet — the contract is documented in the
 * blueprint but the concrete class lands with the parent's
 * `DefaultDispatchGateway` implementation. This listener uses the
 * `#[OnEvent]` attribute to register against the anticipated FQCN;
 * runtime resolution happens through the events package's discovery
 * pass. When the parent lands the event class, this listener wires
 * up automatically — no code change here.
 *
 * `ShouldQueue` — every listener runs on the `notifications` queue
 * so the dispatch path stays snappy under load.
 *
 * @category NotificationsInApp
 *
 * @since    0.1.0
 */
final class HandleInAppDispatch implements ShouldQueue
{
    /**
     * The Laravel queue this listener runs on.
     *
     * @var string
     */
    public string $queue = 'notifications';

    /**
     * @param  LoggerInterface  $log  Structured logger.
     */
    public function __construct(
        private readonly LoggerInterface $log,
    ) {
    }

    /**
     * Handle a `NotificationDispatched` event.
     *
     * Filters to `channels_requested` containing `in_app`; ignores
     * events for other channels. Dispatches the broadcast job with
     * just the notification id — the job re-loads the notification
     * to keep the queue payload minimal.
     *
     * The parent event is expected to expose:
     *   - `notificationId` (string) — the persisted notification's key.
     *   - `channels` / `channelsRequested` (array<int, string>) —
     *     resolved channel keys the gateway is fanning out to.
     *
     * We read via property_exists so this listener stays compatible
     * with either property name the parent picks.
     */
    #[OnEvent(event: 'Stackra\Notifications\Events\NotificationDispatched')]
    public function handle(object $event): void
    {
        if (! (bool) \config('notifications-in-app.enabled', true)) {
            // Master kill-switch off — the listener no-ops without
            // enqueuing the broadcast job.
            return;
        }

        $notificationId = $this->extractNotificationId($event);
        $channels       = $this->extractChannels($event);

        if ($notificationId === null) {
            $this->log->warning('notifications-in-app: dispatch event missing notification id', [
                'event_class' => \get_class($event),
            ]);

            return;
        }

        if (! \in_array('in_app', $channels, true)) {
            // The dispatch resolved to channels this transport does
            // not own — noop.
            return;
        }

        BroadcastInAppNotificationJob::dispatch($notificationId);
    }

    /**
     * Extract the notification id from the event object. Handles
     * either camelCase or snake_case property naming — we defer to
     * whichever the parent picks.
     */
    private function extractNotificationId(object $event): ?string
    {
        foreach (['notificationId', 'notification_id', 'notification'] as $key) {
            if (! \property_exists($event, $key)) {
                continue;
            }

            /** @var mixed $value */
            $value = $event->{$key};

            if (\is_string($value) && $value !== '') {
                return $value;
            }

            if (\is_object($value) && \method_exists($value, 'getKey')) {
                $key = $value->getKey();

                return $key === null ? null : (string) $key;
            }
        }

        return null;
    }

    /**
     * Extract the resolved channel list from the event object.
     *
     * @return list<string>
     */
    private function extractChannels(object $event): array
    {
        foreach (['channels', 'channelsRequested', 'channels_requested'] as $key) {
            if (! \property_exists($event, $key)) {
                continue;
            }

            /** @var mixed $value */
            $value = $event->{$key};

            if (\is_array($value)) {
                return \array_values(\array_map('strval', $value));
            }
        }

        return [];
    }
}
