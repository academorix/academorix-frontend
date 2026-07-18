<?php

declare(strict_types=1);

namespace Academorix\Domains\Events;

use Academorix\Domains\Models\Domain;
use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a certificate is renewed / rotated.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'domains.certificate.rotated')]
final readonly class CertificateRotated implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public Domain $domain)
    {
    }
}
