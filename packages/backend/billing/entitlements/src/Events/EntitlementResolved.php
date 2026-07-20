<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Events;

use Academorix\Entitlements\Models\Entitlement;
use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a new `Entitlement` row is upserted for a tenant.
 *
 * Fires on tenant creation + plan sync + manual override. Listeners
 * warm downstream caches + emit compliance audit rows.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'entitlements.entitlement.resolved')]
final readonly class EntitlementResolved implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public Entitlement $entitlement)
    {
    }
}
