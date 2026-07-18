<?php

declare(strict_types=1);

namespace Academorix\Domains\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Kind of a {@see \Academorix\Domains\Models\Domain}.
 *
 * ## Cases
 *
 *  * {@see self::Subdomain} — auto-issued from application central host
 *    (`{slug}.{application.central_host}`). First domain of every tenant.
 *  * {@see self::Custom}    — customer's own domain, verified via DNS.
 *  * {@see self::Alias}     — redirects to the tenant's primary.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum DomainKind: string
{
    use Enum;

    #[Label('Subdomain')]
    #[Description('Auto-issued subdomain of the application central host. Every tenant has one.')]
    case Subdomain = 'subdomain';

    #[Label('Custom')]
    #[Description('Customer-owned custom domain. Requires DNS verification before promotion.')]
    case Custom = 'custom';

    #[Label('Alias')]
    #[Description('Extra domain that redirects to the tenant primary.')]
    case Alias = 'alias';
}
