<?php

declare(strict_types=1);

namespace Academorix\Notifications\Push\Attributes;

use Attribute;

/**
 * Register a class as a push provider driver.
 *
 * A push provider driver implements
 * {@see \Academorix\Notifications\Push\Contracts\Services\PushTransportInterface}
 * and knows how to send an envelope to its concrete backend (FCM, APNs, Expo,
 * OneSignal, or an in-house transport).
 *
 * ```php
 * #[AsPushProvider(
 *     name: 'fcm',
 *     platforms: ['android', 'web'],
 *     supportsBatching: true,
 * )]
 * final class FcmTransport implements PushTransportInterface
 * {
 * }
 * ```
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class AsPushProvider
{
    /**
     * @param  string        $name              Driver key (matches PushProvider case value).
     * @param  list<string>  $platforms         Platforms this driver supports.
     * @param  bool          $supportsBatching  Whether the driver can send N envelopes in one API call.
     * @param  bool          $enabled           Feature-flag toggle. Set to `false` to keep the class in the codebase but skip registration.
     */
    public function __construct(
        public string $name,
        public array $platforms = [],
        public bool $supportsBatching = false,
        public bool $enabled = true,
    ) {
    }
}
