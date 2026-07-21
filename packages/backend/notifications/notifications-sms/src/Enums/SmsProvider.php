<?php

declare(strict_types=1);

namespace Stackra\Notifications\Sms\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * SMS provider drivers supported by the module.
 *
 * ## Cases
 *
 *  * {@see self::Twilio}       — Twilio Messaging API.
 *  * {@see self::MessageBird}  — MessageBird SMS API.
 *  * {@see self::Vonage}       — Vonage (nexmo) SMS API.
 *  * {@see self::Plivo}        — Plivo Messages API.
 *  * {@see self::AwsSns}       — AWS Simple Notification Service.
 *  * {@see self::Log}          — Log-only transport for dev + staging.
 *  * {@see self::Array_}       — In-memory transport for tests.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum SmsProvider: string
{
    use Enum;

    #[Label('Twilio')]
    #[Description('Twilio Messaging API — bandwidth-elastic global SMS.')]
    case Twilio = 'twilio';

    #[Label('MessageBird')]
    #[Description('MessageBird SMS API — EU-oriented provider.')]
    case MessageBird = 'messagebird';

    #[Label('Vonage')]
    #[Description('Vonage / Nexmo SMS API — global aggregator.')]
    case Vonage = 'vonage';

    #[Label('Plivo')]
    #[Description('Plivo Messages API — cost-competitive global SMS.')]
    case Plivo = 'plivo';

    #[Label('AWS SNS')]
    #[Description('AWS Simple Notification Service — SMS transactional transport.')]
    case AwsSns = 'aws-sns';

    #[Label('Log Driver')]
    #[Description('Log-only driver — dev / staging trace transport.')]
    case Log = 'log';

    #[Label('Array Driver')]
    #[Description('In-memory driver — test-only transport.')]
    case Array_ = 'array';
}
