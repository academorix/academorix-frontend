<?php

declare(strict_types=1);

namespace Academorix\Domains\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Outcome of the last `VerifyDomainDnsJob` check for a
 * {@see \Academorix\Domains\Models\DomainRecord}.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum DnsRecordStatus: string
{
    use Enum;

    #[Label('Unknown')]
    #[Description('No check has run yet. Default state on create.')]
    case Unknown = 'unknown';

    #[Label('Matches')]
    #[Description('Observed value matches expected. Parent Domain progresses toward verified.')]
    case Matches = 'matches';

    #[Label('Missing')]
    #[Description('Record does not exist on real DNS. Verification blocked.')]
    case Missing = 'missing';

    #[Label('Mismatch')]
    #[Description('Record exists but value diverges. Verification blocked.')]
    case Mismatch = 'mismatch';

    #[Label('Error')]
    #[Description('DNS lookup failed (network / resolver error). Retry with backoff.')]
    case Error = 'error';
}
