<?php

declare(strict_types=1);

namespace Academorix\Notifications\Attributes;

use Attribute;

/**
 * Marks a class as a notification channel transport.
 *
 * Applied by channel modules (`notifications-mail`, `notifications-sms`,
 * `notifications-push`, `notifications-in-app`) to their concrete
 * transport class. Discovered at boot; the discovered class is
 * registered with the `NotificationChannelRegistry` under its
 * declared channel key.
 *
 * ## Example
 *
 * ```php
 * #[AsNotificationChannel(channel: 'mail')]
 * final class MailChannel implements NotificationChannelInterface
 * {
 *     // ...
 * }
 * ```
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class AsNotificationChannel
{
    /**
     * @param  string                $channel   Channel key (e.g. `mail`).
     * @param  array<string, mixed>  $features  Feature capability map.
     */
    public function __construct(
        public string $channel,
        public array $features = [],
    ) {
    }
}
