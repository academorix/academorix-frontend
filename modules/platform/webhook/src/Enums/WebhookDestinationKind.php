<?php

declare(strict_types=1);

namespace Academorix\Webhook\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Registered destination-driver keys.
 *
 * ## Cases
 *
 *  * {@see self::Https}      — standard HTTPS POST/PUT/PATCH.
 *  * {@see self::EventBridge}— AWS EventBridge event bus.
 *  * {@see self::PubSub}     — GCP Pub/Sub topic.
 *  * {@see self::MtlsHttps}  — HTTPS with mutual-TLS client authentication.
 *
 * The enum is the canonical name; the registry resolves the key to a
 * concrete `WebhookDestinationInterface` implementation at boot.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum WebhookDestinationKind: string
{
    use Enum;

    #[Label('HTTPS')]
    #[Description('Standard HTTPS request (POST / PUT / PATCH). Ships in v1.')]
    case Https = 'https';

    #[Label('AWS EventBridge')]
    #[Description('AWS EventBridge event bus. Requires the AWS SDK; feature-flag guarded.')]
    case EventBridge = 'eventbridge';

    #[Label('GCP Pub/Sub')]
    #[Description('GCP Pub/Sub topic. Requires the Google Cloud SDK; feature-flag guarded.')]
    case PubSub = 'pubsub';

    #[Label('mTLS HTTPS')]
    #[Description('HTTPS with mutual-TLS client authentication. Feature-flag guarded.')]
    case MtlsHttps = 'mtls-https';
}
