<?php

declare(strict_types=1);

namespace Academorix\Notifications\Sms\Data;

use Academorix\Notifications\Sms\Enums\SmsProvider;
use Spatie\LaravelData\Data;

/**
 * Provider-agnostic SMS envelope.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
final class SmsEnvelope extends Data
{
    /**
     * @param  string       $notificationId  ULID of the parent Notification.
     * @param  string       $deliveryId      ULID of this delivery attempt.
     * @param  SmsProvider  $provider        Target provider.
     * @param  string       $phone           Recipient phone in E.164.
     * @param  string       $body            SMS body (plain-text).
     * @param  string|null  $senderId        Optional sender ID / short code.
     * @param  string|null  $tenantId        Owning tenant — carried for cost aggregation.
     */
    public function __construct(
        public string $notificationId,
        public string $deliveryId,
        public SmsProvider $provider,
        public string $phone,
        public string $body,
        public ?string $senderId = null,
        public ?string $tenantId = null,
    ) {
    }
}
