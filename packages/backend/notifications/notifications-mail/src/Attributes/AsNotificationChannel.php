<?php

declare(strict_types=1);

namespace Stackra\Notifications\Mail\Attributes;

use Attribute;

/**
 * Register a channel-driver class with the parent notifications
 * module's channel registry.
 *
 * A channel driver knows how to translate a `NotificationDispatched`
 * event into its transport (Reverb broadcast, SMTP mail send, Twilio
 * SMS send, FCM push). Each concrete driver carries this attribute
 * so the framework's generic hydration pump can register it into
 * {@see \Stackra\Notifications\Contracts\Services\NotificationChannelRegistryInterface}
 * at boot.
 *
 * **Interop note.** This attribute intentionally MIRRORS the sibling
 * `Stackra\Notifications\InApp\Attributes\AsNotificationChannel`
 * shape verbatim — same constructor signature, same field names.
 * The parent registry will eventually consume a single canonical
 * attribute; until then each channel module ships its own compatible
 * copy so discovery works before the parent unification lands.
 *
 * ```php
 * #[AsNotificationChannel(
 *     key: 'mail',
 *     kind: 'external',
 *     providerKind: 'saas',
 *     supportsOpenTracking: true,
 *     supportsClickTracking: true,
 *     supportsDeliveryTracking: true,
 * )]
 * final class MailChannel implements MailChannelInterface
 * {
 * }
 * ```
 *
 * Blueprint reference:
 *   modules/notifications/blueprints/notifications-mail/module.json §channelRegistration
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class AsNotificationChannel
{
    /**
     * @param  string  $key
     *   Channel identifier (e.g. `in_app`, `mail`, `push`, `sms`).
     *   Matches {@see \Stackra\Notifications\Enums\NotificationChannel}
     *   backing values.
     *
     * @param  string  $kind
     *   Broad classification: `internal` (self-hosted, no third
     *   party) or `external` (routes through a provider).
     *
     * @param  string  $providerKind
     *   How the transport is delivered: `self-hosted`, `saas`,
     *   `mixed`. Feeds into the subprocessors compliance surface.
     *
     * @param  bool  $supportsOpenTracking
     *   Whether the driver can report open events back into the
     *   `NotificationDelivery.opened_at` column.
     *
     * @param  bool  $supportsClickTracking
     *   Whether the driver can report click events into
     *   `NotificationDelivery.last_click_at`.
     *
     * @param  bool  $supportsDeliveryTracking
     *   Whether the driver can transition state to `delivered`
     *   (vs. only `sent`) with a provider confirmation.
     *
     * @param  bool  $enabled
     *   Toggle discovery off without deleting the class — useful
     *   for feature-flagging an in-progress driver.
     */
    public function __construct(
        public string $key,
        public string $kind = 'internal',
        public string $providerKind = 'self-hosted',
        public bool $supportsOpenTracking = false,
        public bool $supportsClickTracking = false,
        public bool $supportsDeliveryTracking = false,
        public bool $enabled = true,
    ) {
    }
}
