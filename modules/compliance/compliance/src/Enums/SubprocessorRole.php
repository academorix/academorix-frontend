<?php

declare(strict_types=1);

namespace Academorix\Compliance\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Role a third-party subprocessor performs. Drives categorisation
 * in the public Trust Center feed.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum SubprocessorRole: string
{
    use Enum;

    #[Label('Storage')]
    #[Description('Object / blob storage for tenant files.')]
    case Storage = 'storage';

    #[Label('CDN')]
    #[Description('Content delivery network for public assets.')]
    case Cdn = 'cdn';

    #[Label('Email Delivery')]
    #[Description('Transactional email delivery.')]
    case EmailDelivery = 'email_delivery';

    #[Label('SMS Delivery')]
    #[Description('SMS gateway.')]
    case SmsDelivery = 'sms_delivery';

    #[Label('Push Delivery')]
    #[Description('Mobile push notification gateway.')]
    case PushDelivery = 'push_delivery';

    #[Label('Payment Processor')]
    #[Description('Payment card processor (Stripe / Paddle / etc).')]
    case PaymentProcessor = 'payment_processor';

    #[Label('Analytics')]
    #[Description('Product analytics.')]
    case Analytics = 'analytics';

    #[Label('Error Tracking')]
    #[Description('Runtime error monitoring.')]
    case ErrorTracking = 'error_tracking';

    #[Label('Customer Support')]
    #[Description('Ticketing / support desk.')]
    case CustomerSupport = 'customer_support';

    #[Label('AI Inference')]
    #[Description('LLM / ML inference provider.')]
    case AiInference = 'ai_inference';

    #[Label('AI Training')]
    #[Description('LLM / ML training vendor.')]
    case AiTraining = 'ai_training';

    #[Label('Backup')]
    #[Description('Off-site backup provider.')]
    case Backup = 'backup';

    #[Label('Identity Provider')]
    #[Description('SSO / SAML / OIDC identity provider.')]
    case IdentityProvider = 'identity_provider';
}
