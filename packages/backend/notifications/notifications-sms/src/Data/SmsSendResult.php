<?php

declare(strict_types=1);

namespace Academorix\Notifications\Sms\Data;

use Spatie\LaravelData\Data;

/**
 * Outcome of one SMS send attempt.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
final class SmsSendResult extends Data
{
    /**
     * @param  bool         $accepted           Whether the provider accepted the SMS.
     * @param  string|null  $providerMessageId  Provider-side message id (SID).
     * @param  int|null     $costMicroUnits     Estimated cost in currency micro-units (final cost comes on the delivery webhook).
     * @param  string|null  $errorCode          Provider error code.
     * @param  string|null  $errorMessage       Human-readable provider message.
     * @param  bool         $undeliverable      Whether the failure is permanent (invalid number, unreachable carrier).
     * @param  bool         $retryable          Whether the failure is transient.
     */
    public function __construct(
        public bool $accepted,
        public ?string $providerMessageId = null,
        public ?int $costMicroUnits = null,
        public ?string $errorCode = null,
        public ?string $errorMessage = null,
        public bool $undeliverable = false,
        public bool $retryable = false,
    ) {
    }

    /**
     * Convenience factory — accepted result.
     */
    public static function accepted(string $providerMessageId, ?int $costMicroUnits = null): self
    {
        return new self(
            accepted: true,
            providerMessageId: $providerMessageId,
            costMicroUnits: $costMicroUnits,
        );
    }
}
