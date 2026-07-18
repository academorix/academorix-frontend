<?php

declare(strict_types=1);

namespace Academorix\Notifications\Push\Data;

use Spatie\LaravelData\Data;

/**
 * Outcome of one push send attempt.
 *
 * The transport driver constructs this after the provider call; the
 * `SendPushJob` reads it to update the {@see \Academorix\Notifications\Push\Models\PushSubscription}
 * lifecycle + emit the correct event.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
final class PushSendResult extends Data
{
    /**
     * @param  bool         $accepted           Whether the provider accepted the envelope.
     * @param  string|null  $providerMessageId  Provider-side message id (returned on accept).
     * @param  string|null  $errorCode          Provider error code (returned on reject / retry).
     * @param  string|null  $errorMessage       Human-readable provider message.
     * @param  bool         $invalidToken       Whether the provider signalled the token is no longer valid.
     * @param  bool         $retryable          Whether the failure is transient (network / 5xx).
     */
    public function __construct(
        public bool $accepted,
        public ?string $providerMessageId = null,
        public ?string $errorCode = null,
        public ?string $errorMessage = null,
        public bool $invalidToken = false,
        public bool $retryable = false,
    ) {
    }

    /**
     * Convenience factory — accepted result.
     */
    public static function accepted(string $providerMessageId): self
    {
        return new self(accepted: true, providerMessageId: $providerMessageId);
    }

    /**
     * Convenience factory — invalid-token rejection.
     */
    public static function invalidToken(string $errorCode = 'invalid_token', ?string $errorMessage = null): self
    {
        return new self(
            accepted: false,
            errorCode: $errorCode,
            errorMessage: $errorMessage,
            invalidToken: true,
        );
    }

    /**
     * Convenience factory — retryable failure (network, 5xx).
     */
    public static function retryable(string $errorCode, ?string $errorMessage = null): self
    {
        return new self(
            accepted: false,
            errorCode: $errorCode,
            errorMessage: $errorMessage,
            retryable: true,
        );
    }
}
