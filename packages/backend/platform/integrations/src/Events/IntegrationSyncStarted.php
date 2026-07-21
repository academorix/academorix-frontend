<?php

declare(strict_types=1);

namespace Stackra\Integrations\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Integrations\Models\TenantIntegration;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when {@see \Stackra\Integrations\Jobs\SyncIntegrationJob}
 * begins a sync pass against an integration.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'integrations.integration.sync_started')]
final readonly class IntegrationSyncStarted implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public TenantIntegration $integration)
    {
    }
}
