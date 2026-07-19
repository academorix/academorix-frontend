<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Tenancy\Models\Tenant;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a Tenant transitions back to `status = active` from
 * a temporary non-active state (`suspended`, `grace`, `trialing`).
 *
 * The Observer clears `suspended_at` + `grace_ends_at` in the same
 * save that fires this event.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'tenancy.tenant.resumed')]
final readonly class TenantResumed implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  Tenant  $tenant  The resumed Tenant.
     */
    public function __construct(public Tenant $tenant)
    {
    }
}
