<?php

declare(strict_types=1);

namespace Academorix\Notifications\Mail\Listeners;

use Academorix\Events\Attributes\OnEvent;
use Academorix\Notifications\Mail\Jobs\SendMailJob;
use Illuminate\Contracts\Queue\ShouldQueue;
use Psr\Log\LoggerInterface;

/**
 * Subscribes to the parent notifications module's
 * `NotificationDispatched` event and translates it into a queued
 * {@see SendMailJob} when the resolved channels include `mail`.
 *
 * ## Blueprint reference
 *
 *   modules/notifications/blueprints/notifications-mail/listeners.json
 *   →  event   : `notifications::NotificationDispatched`
 *   →  filter  : `event.channels_requested contains 'mail'`
 *   →  purpose : Dispatches `SendMailJob`; the job re-loads the
 *                notification to keep the queue payload minimal.
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
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
final class HandleMailDispatch implements ShouldQueue
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
     * Filters to `channels_requested` containing `mail`; ignores
     * events for other channels. Dispatches `SendMailJob` with just
     * the notification id — the job re-loads it.
     */
    #[OnEvent(event: 'Academorix\Notifications\Events\NotificationDispatched')]
    public function handle(object $event): void
    {
        if (! (bool) \config('notifications-mail.enabled', true)) {
            return;
        }

        $notificationId = $this->extractNotificationId($event);
        $channels       = $this->extractChannels($event);

        if ($notificationId === null) {
            $this->log->warning('notifications-mail: dispatch event missing notification id', [
                'event_class' => \get_class($event),
            ]);

            return;
        }

        $channelKey = (string) \config('notifications-mail.channel_key', 'mail');

        if (! \in_array($channelKey, $channels, true)) {
            return;
        }

        SendMailJob::dispatch($notificationId);
    }

    /**
     * Extract the notification id from the event object. Handles
     * either camelCase or snake_case property naming — the parent's
     * final shape is not yet locked so we tolerate both.
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
