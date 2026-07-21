<?php

declare(strict_types=1);

namespace Stackra\Domains\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Method used to verify ownership of a Domain.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum DomainVerificationMethod: string
{
    use Enum;

    #[Label('DNS TXT')]
    #[Description('Expect a TXT record containing our verification token at `_stackra.{host}`.')]
    case DnsTxt = 'dns_txt';

    #[Label('DNS CNAME')]
    #[Description('Expect a CNAME record pointing at our platform host.')]
    case DnsCname = 'dns_cname';

    #[Label('HTTP Meta')]
    #[Description('Expect a `<meta>` tag on the domain root — fallback for hosts without DNS control.')]
    case HttpMeta = 'http_meta';
}
