<?php

declare(strict_types=1);

namespace Academorix\Integrations\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Integrations\Models\TenantIntegration;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when {@see \Academorix\Integrations\Jobs\RefreshIntegrationTokenJob}
 * rotates the OAuth access token stored in `config`. The row is
 * carried on the payload; the new token itself never leaves the
 * server unencrypted.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'integrations.integration.token_refreshed')]
final readonly class IntegrationTokenRefreshed implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public TenantIntegration $integration)
    {
    }
}
