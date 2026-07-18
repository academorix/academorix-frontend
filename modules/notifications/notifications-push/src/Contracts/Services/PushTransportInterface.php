<?php

declare(strict_types=1);

namespace Academorix\Notifications\Push\Contracts\Services;

use Academorix\Notifications\Push\Data\PushEnvelope;
use Academorix\Notifications\Push\Data\PushSendResult;

/**
 * Contract every push transport driver implements.
 *
 * The manager resolves the driver per subscription and calls
 * {@see send()} to dispatch the envelope. Drivers translate the
 * provider-agnostic envelope into their own protocol (FCM v1 REST, APNs
 * HTTP/2, Expo Push, OneSignal REST).
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
interface PushTransportInterface
{
    /**
     * Machine-readable driver name (matches the `PushProvider` case value).
     */
    public function name(): string;

    /**
     * Send a push envelope to a single device token.
     */
    public function send(PushEnvelope $envelope): PushSendResult;

    /**
     * Dry-run a token against the provider to check it's still valid. Called
     * by the observer at register time (see `token_validation.enabled`).
     */
    public function validateToken(string $token, string $platform): bool;
}
