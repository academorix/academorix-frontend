<?php

declare(strict_types=1);

namespace Stackra\Notifications\Sms\Attributes;

use Attribute;

/**
 * Register a class as an SMS provider driver.
 *
 * A driver implements
 * {@see \Stackra\Notifications\Sms\Contracts\Services\SmsTransportInterface}
 * and knows how to send an SMS via its backend (Twilio, MessageBird, Vonage,
 * Plivo, AWS SNS, or an in-house transport).
 *
 * ```php
 * #[AsSmsProvider(name: 'twilio', supportsInbound: true)]
 * final class TwilioTransport implements SmsTransportInterface { ... }
 * ```
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class AsSmsProvider
{
    /**
     * @param  string  $name             Driver key (matches SmsProvider case value).
     * @param  bool    $supportsInbound  Whether the provider supports inbound messages (STOP-keyword processing).
     * @param  bool    $supportsCost     Whether the provider returns final cost data on delivery.
     * @param  bool    $enabled          Feature-flag toggle. `false` = keep in the codebase, skip registration.
     */
    public function __construct(
        public string $name,
        public bool $supportsInbound = true,
        public bool $supportsCost = true,
        public bool $enabled = true,
    ) {
    }
}
