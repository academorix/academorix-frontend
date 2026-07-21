<?php

declare(strict_types=1);

namespace Stackra\Domains\Events;

use Stackra\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a Domain is soft-deleted.
 *
 * Carries plain scalars — the row is a tombstone now. Certificate
 * provisioner listens for this to revoke.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'domains.domain.removed')]
final readonly class DomainRemoved implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public string $tenantId,
        public string $domainId,
        public string $host,
    ) {
    }
}
