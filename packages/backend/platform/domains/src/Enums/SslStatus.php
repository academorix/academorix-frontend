<?php

declare(strict_types=1);

namespace Academorix\Domains\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * TLS certificate state for a Domain.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum SslStatus: string
{
    use Enum;

    #[Label('Pending')]
    #[Description('Awaiting certificate issue. Default state after Domain create.')]
    case Pending = 'pending';

    #[Label('Issued')]
    #[Description('Certificate active. `ssl_issued_at` + `ssl_expires_at` populated.')]
    case Issued = 'issued';

    #[Label('Failed')]
    #[Description('Certificate issue failed. Rotation retries after backoff.')]
    case Failed = 'failed';

    #[Label('Revoked')]
    #[Description('Certificate revoked. Domain still serves the tenant on HTTP; HTTPS refuses.')]
    case Revoked = 'revoked';

    #[Label('None')]
    #[Description('No certificate needed (e.g. alias domain redirecting HTTP-only).')]
    case None = 'none';
}
