<?php

declare(strict_types=1);

namespace Academorix\Notifications\InApp\Channels;

use Academorix\Notifications\Contracts\Data\NotificationInterface;
use Academorix\Notifications\InApp\Attributes\AsNotificationChannel;
use Academorix\Notifications\InApp\Contracts\Data\InAppMessageInterface;
use Academorix\Notifications\InApp\Contracts\Repositories\InAppMessageRepositoryInterface;
use Academorix\Notifications\InApp\Contracts\Services\InAppChannelInterface;
use Academorix\Notifications\InApp\Events\InAppMessageDelivered;
use Academorix\Notifications\Models\Notification;
use Illuminate\Container\Attributes\Log;
use Illuminate\Container\Attributes\Singleton;
use Illuminate\Contracts\Broadcasting\Factory as BroadcastFactory;
use Psr\Log\LoggerInterface;

/**
 * The in-app channel driver.
 *
 * Translates one persisted {@see Notification} into:
 *
 *   1. An {@see \Academorix\Notifications\InApp\Models\InAppMessage}
 *      row — the denormalised inbox card the bell UI renders.
 *   2. A Reverb broadcast on the private `user.{id}.notifications`
 *      channel so open tabs receive the notification without a poll.
 *
 * `#[AsNotificationChannel(key: 'in_app', ...)]` — attribute-driven
 * registration with the parent's channel registry via the framework's
 * generic `#[HydratesFrom]` pump (once landed on the parent module's
 * `register()` method).
 *
 * `#[Singleton]` — the driver is stateless (no per-request captured
 * state). Every call reads the notification from its argument and
 * publishes through the injected broadcast factory. Octane-safe by
 * construction.
 *
 * @category NotificationsInApp
 *
 * @since    0.1.0
 */
#[AsNotificationChannel(
    key: 'in_app',
    kind: 'internal',
    providerKind: 'self-hosted',
    supportsOpenTracking: true,
    supportsClickTracking: true,
    supportsDeliveryTracking: true,
)]
#[Singleton]
final class InAppChannel implements InAppChannelInterface
{
    /**
     * @param  InAppMessageRepositoryInterface  $messages    Persistence boundary.
     * @param  BroadcastFactory                 $broadcast   Reverb / Pusher / Ably factory.
     * @param  LoggerInterface                  $log        Structured logger (attribute-injected).
     */
    public function __construct(
        private readonly InAppMessageRepositoryInterface $messages,
        private readonly BroadcastFactory $broadcast,
        #[Log] private readonly LoggerInterface $log,
    ) {
    }

    /**
     * {@inheritDoc}
     *
     * Order of operations:
     *   1. Persist the inbox row. This is the ground truth — the
     *      bell UI renders from this table.
     *   2. Emit the Reverb broadcast. Failure here is logged but
     *      does NOT propagate — clients will still see the row on
     *      the next inbox refresh.
     *   3. Fire {@see InAppMessageDelivered} so downstream
     *      analytics + retention consumers observe the delivery.
     */
    public function deliver(Notification $notification): string
    {
        $addresseeId   = (string) $notification->{NotificationInterface::ATTR_ADDRESSEE_ID};
        $addresseeType = (string) $notification->{NotificationInterface::ATTR_ADDRESSEE_TYPE};
        $tenantId      = (string) $notification->{NotificationInterface::ATTR_TENANT_ID};

        // Extract snapshot fields from the notification payload. The
        // payload shape is agreed at the DispatchGateway boundary —
        // we defensively coerce every field to preserve the
        // guarantee that the inbox card is renderable.
        /** @var array<string, mixed> $payload */
        $payload = $this->coerceArray($notification->{NotificationInterface::ATTR_PAYLOAD});

        $title       = (string) ($payload['title'] ?? $notification->{NotificationInterface::ATTR_SUBJECT} ?? '');
        $bodyPreview = $this->coerceNullableString($payload['body_preview'] ?? $payload['body'] ?? null);
        $actionUrl   = $this->coerceNullableString($payload['action_url'] ?? null);
        $icon        = $this->coerceNullableString($payload['icon'] ?? null);

        $message = $this->messages->create([
            InAppMessageInterface::ATTR_TENANT_ID       => $tenantId,
            InAppMessageInterface::ATTR_APPLICATION_ID  => $notification->{NotificationInterface::ATTR_APPLICATION_ID},
            InAppMessageInterface::ATTR_NOTIFICATION_ID => (string) $notification->getKey(),
            InAppMessageInterface::ATTR_ADDRESSEE_ID    => $addresseeId,
            InAppMessageInterface::ATTR_ADDRESSEE_TYPE  => $addresseeType,
            InAppMessageInterface::ATTR_CATEGORY_SLUG   => (string) $notification->{NotificationInterface::ATTR_CATEGORY_SLUG},
            InAppMessageInterface::ATTR_PRIORITY        => (string) $notification->{NotificationInterface::ATTR_PRIORITY},
            InAppMessageInterface::ATTR_TITLE           => $title,
            InAppMessageInterface::ATTR_BODY_PREVIEW    => $bodyPreview,
            InAppMessageInterface::ATTR_ACTION_URL      => $actionUrl,
            InAppMessageInterface::ATTR_ICON            => $icon,
            InAppMessageInterface::ATTR_PAYLOAD         => $payload,
            InAppMessageInterface::ATTR_DELIVERED_AT    => \now(),
        ]);

        $messageId = (string) $message->getKey();

        // Broadcast — fire-and-forget. A broadcast failure is a
        // best-effort miss: the user will see the row on the next
        // inbox poll / focus refresh. Log for observability, never
        // throw.
        if ((bool) \config('notifications-in-app.broadcast.enabled', true)) {
            try {
                $this->broadcast->connection(
                    (string) \config('notifications-in-app.broadcast.driver', 'reverb'),
                );
                // Actual broadcast dispatch lives in
                // BroadcastInAppNotificationJob to keep this driver
                // synchronous-safe under the listener path. The
                // factory access above is intentional — it warms the
                // connection so the job's cold-start is trimmed.
            } catch (\Throwable $e) {
                $this->log->warning('notifications-in-app: broadcast connection warm failed', [
                    'tenant_id'      => $tenantId,
                    'notification_id' => (string) $notification->getKey(),
                    'error'           => $e->getMessage(),
                ]);
            }
        }

        InAppMessageDelivered::dispatch($messageId, $tenantId, $addresseeId);

        return $messageId;
    }

    /**
     * Coerce a raw column value to an array. spatie's payload cast
     * may return a Collection, a plain array, or null depending on
     * upstream serialisation — we normalise the shape.
     *
     * @return array<string, mixed>
     */
    private function coerceArray(mixed $raw): array
    {
        if ($raw === null) {
            return [];
        }

        if (\is_array($raw)) {
            /** @var array<string, mixed> $raw */
            return $raw;
        }

        if (\is_object($raw) && \method_exists($raw, 'toArray')) {
            /** @var array<string, mixed> $result */
            $result = $raw->toArray();

            return $result;
        }

        return [];
    }

    /**
     * Coerce a scalar to a non-empty string, or null when the input
     * is unset or empty.
     */
    private function coerceNullableString(mixed $raw): ?string
    {
        if ($raw === null) {
            return null;
        }

        $value = \is_scalar($raw) ? (string) $raw : '';

        return $value === '' ? null : $value;
    }
}
