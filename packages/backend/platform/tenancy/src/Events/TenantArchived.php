<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Tenancy\Models\Tenant;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a Tenant is archived (soft-deleted + `status = archived`).
 *
 * Retention job picks it up 30 days later for hard-delete (see
 * `HardDeleteArchivedTenantJob` + `TenantErased`).
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'tenancy.tenant.archived')]
final readonly class TenantArchived implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  Tenant  $tenant  The archived Tenant.
     */
    public function __construct(public Tenant $tenant)
    {
    }
}
