<?php

declare(strict_types=1);

/**
 * Smtp Encryption Enumeration
 *
 * Defines the set of allowed values for Smtp Encryption within the Settings module.
 * Supported values include: Tls, Ssl, None.
 *
 * @category Enums
 *
 * @since    1.0.0
 */
namespace Academorix\Settings\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Enum;

/** SMTP encryption protocols. */
enum SmtpEncryption: string
{
    use Enum;

    #[Label('TLS')]
    #[Description('Transport Layer Security encryption (recommended).')]
    case Tls = 'tls';

    #[Label('SSL')]
    #[Description('Secure Sockets Layer encryption.')]
    case Ssl = 'ssl';

    #[Label('None')]
    #[Description('No encryption, sends mail in plain text.')]
    case None = 'none';
}
