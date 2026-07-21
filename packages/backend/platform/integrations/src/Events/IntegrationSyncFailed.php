<?php

declare(strict_types=1);

namespace Stackra\Integrations\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Integrations\Models\TenantIntegration;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a sync pass raises — the `error` payload carries
 * the provider error message (already sanitised of secrets).
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'integrations.integration.sync_failed')]
final readonly class IntegrationSyncFailed implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public TenantIntegration $integration,
        public string $error,
    ) {
    }
}
