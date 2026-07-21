<?php

declare(strict_types=1);

namespace Stackra\Audit\Events;

use Stackra\Events\Attributes\AsEvent;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched at the end of a successful chain-verification run.
 *
 * "Successful" here means the run completed — NOT that every row
 * verified. The payload's `broken` counter carries the number of
 * mismatches the run detected. Listeners:
 *
 *   - observability::MetricsCollector — record verified/broken as
 *     Prometheus gauges tagged by tenant.
 *   - compliance::AuditChainVerifiedListener — clear the "chain
 *     under investigation" flag on tenants whose verification count
 *     is now zero.
 *
 * @category Audit
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'audit.audit.chain_verified')]
final readonly class AuditChainVerified
{
    use Dispatchable;

    /**
     * @param  int  $verified  Number of rows the run successfully
     *   verified. Zero when the tenant has no chain-eligible rows.
     * @param  int  $broken    Number of rows the run detected as
     *   broken. Zero when the chain is intact.
     */
    public function __construct(
        public int $verified,
        public int $broken,
    ) {
    }
}
