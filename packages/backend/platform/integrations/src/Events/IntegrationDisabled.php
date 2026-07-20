<?php

declare(strict_types=1);

namespace Academorix\Integrations\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Integrations\Models\TenantIntegration;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a Tenant integration transitions from `is_active =
 * true` to `is_active = false` — a graceful shut-off that halts sync
 * scheduling but preserves the row for later re-activation.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'integrations.integration.disabled')]
final readonly class IntegrationDisabled implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public TenantIntegration $integration)
    {
    }
}
