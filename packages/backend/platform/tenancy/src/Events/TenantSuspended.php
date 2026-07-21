<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Tenancy\Models\Tenant;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a Tenant transitions to `status = suspended`.
 *
 * Fires from the billing suspension pipeline or a platform-admin
 * action. Consumers: webhook (pause tenant subscriptions), audit
 * trail, notifications (email tenant admin).
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'tenancy.tenant.suspended')]
final readonly class TenantSuspended implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  Tenant  $tenant  The suspended Tenant.
     * @param  string  $reason  Free-form reason recorded in the audit trail.
     */
    public function __construct(
        public Tenant $tenant,
        public string $reason,
    ) {
    }
}
