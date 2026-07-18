<?php

declare(strict_types=1);

namespace Academorix\Notifications\Mail\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Mail transports the channel can delegate to.
 *
 * Every value maps 1:1 to a mailer defined in Laravel's own
 * `config/mail.php`. The channel does NOT own the transport
 * definitions — it selects among them per category or per tenant.
 *
 * ## Cases
 *
 *   * {@see self::Mailgun} — Symfony Mailgun mailer.
 *   * {@see self::SendGrid} — Sendgrid HTTP API mailer.
 *   * {@see self::AwsSes} — AWS SES (SDK or SMTP).
 *   * {@see self::Postmark} — Postmark HTTP API mailer.
 *   * {@see self::Resend} — Resend HTTP API mailer.
 *   * {@see self::Smtp} — Generic SMTP transport (custom SMTP endpoint).
 *   * {@see self::Log} — Laravel `log` mailer (dev-only sink).
 *   * {@see self::Array_} — Laravel `array` mailer (test-only sink).
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum MailProvider: string
{
    use Enum;

    /**
     * Mailgun — Symfony's Mailgun transport (`symfony/mailgun-mailer`).
     */
    #[Label('Mailgun')]
    #[Description('Mailgun HTTP API transport. Signed webhook events verified via HMAC-SHA256.')]
    case Mailgun = 'mailgun';

    /**
     * SendGrid — Twilio SendGrid HTTP API transport.
     */
    #[Label('SendGrid')]
    #[Description('SendGrid HTTP API transport. Signed webhook events verified via Ed25519.')]
    case SendGrid = 'sendgrid';

    /**
     * AWS SES — via `aws/aws-sdk-php` or SMTP endpoint.
     */
    #[Label('AWS SES')]
    #[Description('Amazon Simple Email Service. Webhook events received via SNS with x509 certificate verification.')]
    case AwsSes = 'aws-ses';

    /**
     * Postmark — `symfony/postmark-mailer`.
     */
    #[Label('Postmark')]
    #[Description('Postmark HTTP API transport. Webhook events verified via basic auth header pair.')]
    case Postmark = 'postmark';

    /**
     * Resend — `resend/resend-laravel`.
     */
    #[Label('Resend')]
    #[Description('Resend HTTP API transport. Webhook events verified via Svix (svix-signature header).')]
    case Resend = 'resend';

    /**
     * Custom SMTP endpoint (enterprise bring-your-own).
     */
    #[Label('Custom SMTP')]
    #[Description('Generic SMTP transport. Used for enterprise bring-your-own-SMTP endpoints. No webhook events.')]
    case Smtp = 'smtp';

    /**
     * Laravel `log` mailer — sink to the log channel (dev).
     */
    #[Label('Log (dev)')]
    #[Description('Laravel log mailer. Writes rendered mail to the log channel — dev / debug only.')]
    case Log = 'log';

    /**
     * Laravel `array` mailer — sink to an in-memory buffer (tests).
     */
    #[Label('Array (test)')]
    #[Description('Laravel array mailer. Buffers rendered mail in memory — test-only sink.')]
    case Array_ = 'array';
}
