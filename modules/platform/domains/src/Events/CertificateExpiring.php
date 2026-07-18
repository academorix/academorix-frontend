<?php

declare(strict_types=1);

namespace Academorix\Domains\Events;

use Academorix\Domains\Models\Domain;
use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a certificate is close to expiry (30 days by
 * default). Rotation scheduler dispatches; tenant admin notification
 * listener sends warning email.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'domains.certificate.expiring')]
final readonly class CertificateExpiring implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public Domain $domain,
        public int $daysUntilExpiry,
    ) {
    }
}
