<?php

declare(strict_types=1);

namespace Stackra\Notifications\Mail\Listeners;

use Stackra\Events\Attributes\OnEvent;
use Stackra\Notifications\Mail\Jobs\IngestMailProviderWebhookJob;
use Illuminate\Contracts\Queue\ShouldQueue;
use Psr\Log\LoggerInterface;

/**
 * Subscribes to the `webhook` module's `InboundWebhookReceived`
 * event, filters by `namespace = notifications-mail`, and
 * dispatches {@see IngestMailProviderWebhookJob} to normalise the
 * provider payload.
 *
 * ## Blueprint reference
 *
 *   modules/notifications/blueprints/notifications-mail/listeners.json
 *   →  event  : `webhook::InboundWebhookReceived`
 *   →  filter : `event.namespace === 'notifications-mail'`
 *
 * The webhook module owns the universal inbound receiver
 * (`POST /webhooks/inbound/notifications-mail/{provider}`) + the
 * signature-verification middleware. This listener only cares
 * about the semantic namespace filter — everything provider-specific
 * happens inside the ingestor.
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
final class IngestMailProviderWebhookListener implements ShouldQueue
{
    /**
     * The Laravel queue this listener runs on.
     *
     * @var string
     */
    public string $queue = 'notifications-webhooks';

    /**
     * @param  LoggerInterface  $log  Structured logger.
     */
    public function __construct(
        private readonly LoggerInterface $log,
    ) {
    }

    /**
     * Handle an `InboundWebhookReceived` event.
     */
    #[OnEvent(event: 'Stackra\Webhook\Events\InboundWebhookReceived')]
    public function handle(object $event): void
    {
        if (! (bool) \config('notifications-mail.enabled', true)) {
            return;
        }

        $namespace = (string) ($this->readProperty($event, 'namespace') ?? '');

        if ($namespace !== 'notifications-mail') {
            return;
        }

        $provider = (string) ($this->readProperty($event, 'provider') ?? '');
        $payload  = $this->readArray($event, 'payload');
        $headers  = $this->readArray($event, 'headers');

        if ($provider === '') {
            $this->log->warning('notifications-mail: inbound webhook missing provider slug');

            return;
        }

        IngestMailProviderWebhookJob::dispatch($provider, $payload, $headers);
    }

    /**
     * Read a scalar property from the event.
     */
    private function readProperty(object $event, string $key): mixed
    {
        return \property_exists($event, $key) ? $event->{$key} : null;
    }

    /**
     * Read an array property from the event, defaulting to `[]`.
     *
     * @return array<string, mixed>
     */
    private function readArray(object $event, string $key): array
    {
        $value = $this->readProperty($event, $key);

        if (\is_array($value)) {
            /** @var array<string, mixed> $value */
            return $value;
        }

        return [];
    }
}
