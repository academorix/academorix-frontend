<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Tenancy\Models\Tenant;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched AFTER the provisioning transaction commits.
 *
 * Safe surface for side effects that hit external systems (welcome
 * email, DNS record creation, search indexing). Listeners run at-most-
 * once thanks to `ShouldDispatchAfterCommit`.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'tenancy.tenant.provisioned')]
final readonly class TenantProvisioned implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  Tenant  $tenant  The provisioned Tenant.
     */
    public function __construct(public Tenant $tenant)
    {
    }
}
