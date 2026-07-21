<?php

declare(strict_types=1);

namespace Stackra\Notifications\Sms\Contracts\Services;

use Stackra\Notifications\Sms\Data\SmsEnvelope;
use Stackra\Notifications\Sms\Data\SmsSendResult;

/**
 * Contract every SMS transport driver implements.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
interface SmsTransportInterface
{
    /**
     * Machine-readable driver name (matches the `SmsProvider` case value).
     */
    public function name(): string;

    /**
     * Send an SMS envelope.
     */
    public function send(SmsEnvelope $envelope): SmsSendResult;
}
