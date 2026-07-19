<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Events;

use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched BEFORE the hard-delete of an archived Tenant fires.
 *
 * GDPR Art. 17 (right-to-erasure) cascade signal — every dependent
 * row must be removed or anonymised. Downstream modules (`activity`,
 * `audit`, `settings`, `webhook`, ...) listen for this and produce
 * their compliance-anonymisation entries before the FK cascade
 * runs.
 *
 * The payload carries plain scalars (not the Tenant model) because
 * the model row is about to disappear.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'tenancy.tenant.erased')]
final readonly class TenantErased implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  string  $tenantId       The Tenant id that is being erased.
     * @param  string  $applicationId  The Application the tenant belonged to.
     */
    public function __construct(
        public string $tenantId,
        public string $applicationId,
    ) {
    }
}
