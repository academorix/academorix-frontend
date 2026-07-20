<?php

declare(strict_types=1);

namespace Academorix\Integrations\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Integrations\Models\TenantIntegration;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a Tenant integration transitions to `is_active =
 * true` — the moment the module considers it "wired + ready to sync".
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'integrations.integration.configured')]
final readonly class IntegrationConfigured implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public TenantIntegration $integration)
    {
    }
}
