<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Tenancy\Models\Tenant;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a Tenant is manually unsuspended by a platform admin.
 *
 * Distinct from {@see TenantResumed} — unsuspension is the platform-
 * admin action that requires re-enabling integrations (webhooks / SSO
 * / SCIM); {@see TenantResumed} is the general lifecycle transition
 * (grace → active, trialing → active).
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'tenancy.tenant.unsuspended')]
final readonly class TenantUnsuspended implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  Tenant  $tenant  The unsuspended Tenant.
     */
    public function __construct(public Tenant $tenant)
    {
    }
}
