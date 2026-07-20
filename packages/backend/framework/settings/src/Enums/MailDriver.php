<?php

declare(strict_types=1);

/**
 * Mail Driver Enumeration
 *
 * Defines the set of allowed values for Mail Driver within the Settings module.
 * Supported values include: Smtp, Mailgun, Ses, Postmark.
 *
 * @category Enums
 *
 * @since    1.0.0
 */
namespace Academorix\Settings\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Enum;

/** Supported mail transport drivers. */
enum MailDriver: string
{
    use Enum;

    #[Label('SMTP')]
    #[Description('Universal option for any SMTP server.')]
    case Smtp = 'smtp';

    #[Label('Mailgun')]
    #[Description('Mailgun email delivery service.')]
    case Mailgun = 'mailgun';

    #[Label('Amazon SES')]
    #[Description('AWS Simple Email Service.')]
    case Ses = 'ses';

    #[Label('Postmark')]
    #[Description('Excellent deliverability and detailed analytics.')]
    case Postmark = 'postmark';

    #[Label('Log')]
    #[Description('Writes emails to log file for development and testing.')]
    case Log = 'log';
}
