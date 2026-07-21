<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Tenancy\Models\Tenant;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched inside the DB transaction that creates a new Tenant,
 * BEFORE the transaction commits.
 *
 * Used by same-transaction sub-provisioners (default Organization,
 * default Branch, default Region, owner User) so those rows land in
 * the same commit as the Tenant row. **Does NOT implement
 * `ShouldDispatchAfterCommit`** — the whole point is to fire inside
 * the transaction so listeners can piggy-back.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'tenancy.tenant.provisioning')]
final readonly class TenantProvisioning
{
    use Dispatchable;

    /**
     * @param  Tenant  $tenant  The Tenant row being provisioned (already
     *                          persisted but transaction not committed).
     */
    public function __construct(public Tenant $tenant)
    {
    }
}
