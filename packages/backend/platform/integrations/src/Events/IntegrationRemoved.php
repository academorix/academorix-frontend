<?php

declare(strict_types=1);

namespace Academorix\Integrations\Events;

use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a Tenant integration is soft-deleted.
 *
 * Carries plain scalars because the row is a tombstone at dispatch
 * time — listeners cannot rely on the ORM object being loadable.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'integrations.integration.removed')]
final readonly class IntegrationRemoved implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public string $tenantId,
        public string $integrationId,
        public string $kind,
    ) {
    }
}
