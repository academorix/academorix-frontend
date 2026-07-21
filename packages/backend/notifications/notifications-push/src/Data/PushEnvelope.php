<?php

declare(strict_types=1);

namespace Stackra\Notifications\Push\Data;

use Stackra\Notifications\Push\Enums\PushPlatform;
use Stackra\Notifications\Push\Enums\PushProvider;
use Spatie\LaravelData\Data;

/**
 * Provider-agnostic push envelope.
 *
 * The transport driver translates this into the provider's own protocol
 * (FCM v1 REST, APNs HTTP/2, Expo Push, OneSignal). Deliberately narrow —
 * every provider we support handles at least title + body + custom data +
 * badge + sound.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
final class PushEnvelope extends Data
{
    /**
     * @param  string        $notificationId  ULID of the parent Notification.
     * @param  string        $deliveryId      ULID of this delivery attempt.
     * @param  PushProvider  $provider        Target provider.
     * @param  PushPlatform  $platform        Target device platform.
     * @param  string        $deviceToken     Decrypted device token — never persisted.
     * @param  string        $title           Notification title (short — <= 40 chars UX-recommended).
     * @param  string        $body            Notification body (short — <= 100 chars UX-recommended).
     * @param  array<string, mixed>  $data    Provider-specific custom data payload.
     * @param  int|null      $badge           iOS-only badge count.
     * @param  string|null   $sound           Sound identifier (`default` or a file name).
     * @param  string|null   $deepLink        Deep-link URL the client SDK opens on tap.
     * @param  string|null   $category        Notification category key (drives OS action buttons).
     */
    public function __construct(
        public string $notificationId,
        public string $deliveryId,
        public PushProvider $provider,
        public PushPlatform $platform,
        public string $deviceToken,
        public string $title,
        public string $body,
        public array $data = [],
        public ?int $badge = null,
        public ?string $sound = null,
        public ?string $deepLink = null,
        public ?string $category = null,
    ) {
    }
}
