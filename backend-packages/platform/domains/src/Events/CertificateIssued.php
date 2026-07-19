<?php

declare(strict_types=1);

namespace Academorix\Domains\Events;

use Academorix\Domains\Models\Domain;
use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a certificate is successfully issued for a Domain.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'domains.certificate.issued')]
final readonly class CertificateIssued implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public Domain $domain)
    {
    }
}
