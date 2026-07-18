<?php

declare(strict_types=1);

namespace Academorix\Domains\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * DNS record type — mirrors the RFC 1035 + RFC 3596 + RFC 6844 types
 * this module cares about.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum DnsRecordType: string
{
    use Enum;

    #[Label('A')]
    #[Description('IPv4 address record.')]
    case A = 'A';

    #[Label('AAAA')]
    #[Description('IPv6 address record.')]
    case Aaaa = 'AAAA';

    #[Label('CNAME')]
    #[Description('Canonical alias to another hostname.')]
    case Cname = 'CNAME';

    #[Label('TXT')]
    #[Description('Text record — used for ownership verification.')]
    case Txt = 'TXT';

    #[Label('MX')]
    #[Description('Mail exchanger (priority-ordered).')]
    case Mx = 'MX';

    #[Label('CAA')]
    #[Description('Certificate Authority Authorization — pins issuers allowed to sign certificates for this domain.')]
    case Caa = 'CAA';
}
