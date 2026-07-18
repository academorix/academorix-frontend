<?php

declare(strict_types=1);

namespace Academorix\Integrations\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Integrations\Enums\IntegrationSyncStatus;
use Academorix\Integrations\Models\TenantIntegration;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when {@see \Academorix\Integrations\Jobs\SyncIntegrationJob}
 * finishes a sync pass — the `status` payload carries the backing
 * value of {@see IntegrationSyncStatus} (`success` or `partial`).
 *
 * A completed run with `status = failed` is dispatched via the
 * sibling {@see IntegrationSyncFailed} event instead.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'integrations.integration.sync_completed')]
final readonly class IntegrationSyncCompleted implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public TenantIntegration $integration,
        public string $status,
    ) {
    }
}
